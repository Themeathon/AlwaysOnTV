import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import GameDatabase from '~/db/GameDatabase.js';
import pino from '~/utils/Pino.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const SUPPORTED_EXTENSIONS = ['.mp4', '.mkv', '.webm', '.avi', '.mov'];

class ScanLocalVideos extends AbstractEndpoint {
	setup () {
		this.add(this.scanVideos);
	}

	async findVideoFiles (dir) {
		let files = [];
		try {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					files = files.concat(await this.findVideoFiles(fullPath));
				} else if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			pino.error(`Error reading directory ${dir}: ${error.message}`);
		}
		return files;
	}

	async processVideoFile (filePath, videoId) {
		return new Promise((resolve, reject) => {
			const thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
			const thumbnailFileName = `${videoId}.png`;
			const thumbnailPublicPath = `/thumbnails/${thumbnailFileName}`;

			ffmpeg.ffprobe(filePath, (err, metadata) => {
				if (err) {
					pino.error(`Error probing file ${filePath}: ${err.message}`);
					return resolve({ length: 0, thumbnail_url: '' });
				}

				const duration = metadata.format.duration || 0;

				const timestamp = duration > 10 ? '20%' : '1';

				ffmpeg(filePath)
					.on('end', () => {
						resolve({
							length: Math.round(duration),
							thumbnail_url: thumbnailPublicPath,
						});
					})
					.on('error', (err) => {
						pino.error(`Error generating thumbnail for ${filePath}: ${err.message}`);
						resolve({
							length: Math.round(duration),
							thumbnail_url: '',
						});
					})
					.screenshots({
						count: 1,
						folder: thumbnailDir,
						filename: thumbnailFileName,
						timestamps: [timestamp],
						size: '640x360',
					});
			});
		});
	}

	async scanVideos (ctx, next) {
		const basePaths = Config.data.local_media?.base_paths || [];
		if (!basePaths.length) {
			return super.error(ctx, 'No local media base paths configured in config.json');
		}

		const thumbnailDir = path.join(process.cwd(), 'public', 'thumbnails');
		await fs.mkdir(thumbnailDir, { recursive: true });

		let allVideoFiles = [];
		for (const basePath of basePaths) {
			allVideoFiles = allVideoFiles.concat(await this.findVideoFiles(basePath));
		}

		const addedVideos = [];
		const skippedVideos = [];
		const failedVideos = [];

		let videoCounter = await Promise.resolve(VideoDatabase.getMaxLocalVideoId());

		for (const filePath of allVideoFiles) {
			try {
				const existing = await VideoDatabase.tryGet({ file_path: filePath });
				if (existing) {
					skippedVideos.push({ path: filePath, reason: 'Already in database' });
					continue;
				}

				videoCounter++;
				const newVideoId = 'local-' + videoCounter;

				pino.info(`Processing new video: ${filePath} (ID: ${newVideoId})...`);
				const metadata = await this.processVideoFile(filePath, newVideoId);

				const videoData = {
					id: newVideoId,
					title: path.basename(filePath, path.extname(filePath)),
					length: metadata.length,
					thumbnail_url: metadata.thumbnail_url,
					gameId: GameDatabase.getDefaultGameID(),
					source_type: 'local',
					file_path: filePath,
				};

				const createdVideo = await VideoDatabase.createVideo(videoData);
				if (createdVideo) {
					addedVideos.push(createdVideo);
				} else {
					failedVideos.push({ path: filePath, reason: 'Database insertion failed' });
				}

			} catch (error) {
				pino.error(`Failed to process file ${filePath}: ${error.message}`);
				failedVideos.push({ path: filePath, reason: error.message });
			}
		}

		return super.success(ctx, next, {
			added: addedVideos.length,
			skipped: skippedVideos.length,
			failed: failedVideos.length,
		});
	}
}

export default new ScanLocalVideos().middlewares();