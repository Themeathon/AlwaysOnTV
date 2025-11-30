import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import GameDatabase from '~/db/GameDatabase.js';
import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';
import pino from '~/utils/Pino.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import Socket from '~/Socket.js';

//ffmpeg setup
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

	async runBackgroundScan (allVideoFiles) {
		const addedVideos = [];
		const skippedVideos = [];
		const failedVideos = [];

		let videoCounter = await Promise.resolve(VideoDatabase.getMaxLocalVideoId());
		const totalFiles = allVideoFiles.length;

		Socket.io.emit('scan_start', { total: totalFiles });

		let processedCount = 0;

		for (const filePath of allVideoFiles) {
			processedCount++;
			const filename = path.basename(filePath);

			Socket.io.emit('scan_progress', {
				current: processedCount,
				total: totalFiles,
				filename: filename,
			});

			try {
				const existing = await VideoDatabase.tryGet({ file_path: filePath });
				if (existing) {
					let thumbnailMissing = true;

					if (existing.thumbnail_url) {
						const relativePath = existing.thumbnail_url.startsWith('/') ? existing.thumbnail_url.slice(1) : existing.thumbnail_url;
						const absoluteThumbnailPath = path.join(process.cwd(), 'public', relativePath);

						try {
							await fs.access(absoluteThumbnailPath);
							thumbnailMissing = false;
							// eslint-disable-next-line no-unused-vars
						} catch (e) {
							thumbnailMissing = true;
						}
					}

					if (thumbnailMissing) {
						pino.info(`Thumbnail missing for video ${existing.id} (${filename}). Regenerating`);

						const metadata = await this.processVideoFile(filePath, existing.id);

						if (metadata.thumbnail_url) {
							await VideoDatabase.updateVideo(existing.id, {
								thumbnail_url: metadata.thumbnail_url,
							});
						}
					}

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
					await RandomPlaylistDatabase.addVideos(createdVideo.id);
					addedVideos.push(createdVideo);
				} else {
					failedVideos.push({ path: filePath, reason: 'Database insertion failed' });
				}

			} catch (error) {
				pino.error(`Failed to process file ${filePath}: ${error.message}`);
				failedVideos.push({ path: filePath, reason: error.message });
			}
		}

		Socket.io.emit('scan_complete', {
			added: addedVideos.length,
			skipped: skippedVideos.length,
			failed: failedVideos.length,
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

		this.runBackgroundScan(allVideoFiles);

		return super.success(ctx, next, {
			message: 'Background scan started',
			totalFilesFound: allVideoFiles.length,
		});
	}
}

export default new ScanLocalVideos().middlewares();