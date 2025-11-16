import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import GameDatabase from '~/db/GameDatabase.js';
import pino from '~/utils/Pino.js';
import fs from 'node:fs/promises';
import path from 'node:path';

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

	// TODO: Add VideoMetadata from local media
	async getVideoMetadata (filePath) {
		return new Promise((resolve) => {
			resolve({
				title: path.basename(filePath, path.extname(filePath)),
				length: 0,
			});
		});
	}

	async scanVideos (ctx, next) {
		const basePaths = Config.data.local_media?.base_paths || [];
		if (!basePaths.length) {
			return super.error(ctx, 'No local media base paths configured in config.json');
		}

		let allVideoFiles = [];
		for (const basePath of basePaths) {
			allVideoFiles = allVideoFiles.concat(await this.findVideoFiles(basePath));
		}

		// pino.info(`Found ${allVideoFiles.length} potential video files.`);

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

				const metadata = await this.getVideoMetadata(filePath);
				videoCounter++;

				const videoData = {
					id: 'local-' + videoCounter,
					title: metadata.title,
					length: metadata.length,
					thumbnail_url: '', // TODO: Generate thumbnail?
					gameId: GameDatabase.getDefaultGameID(),
					source_type: 'local',
					file_path: filePath,
				};

				const createdVideo = await VideoDatabase.createVideo(videoData);
				if (createdVideo) {
					addedVideos.push(createdVideo);
				} else {
					failedVideos.push({ path: filePath, reason: 'Database insertion failed (maybe duplicate ID somehow?)' });
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