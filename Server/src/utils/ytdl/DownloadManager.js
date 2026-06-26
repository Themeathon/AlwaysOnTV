import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from '~/utils/Pino.js';

const execPromise = util.promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(__dirname, '..', '..', '..', 'cache_downloads');

if (!fs.existsSync(cacheDir)) {
	fs.mkdirSync(cacheDir, { recursive: true });
}

class DownloadManager {
	constructor() {
		this.activeDownloads = new Set();
		this.extensions = ['.mp4', '.mkv', '.webm', '.m4a'];
	}

	getFilePath(videoId) {
		for (const ext of this.extensions) {
			const checkPath = path.join(cacheDir, `${videoId}${ext}`);
			if (fs.existsSync(checkPath)) {
				return checkPath;
			}
		}
		return path.join(cacheDir, `${videoId}.mp4`);
	}

	isDownloaded(videoId) {
		for (const ext of this.extensions) {
			if (fs.existsSync(path.join(cacheDir, `${videoId}${ext}`))) {
				return true;
			}
		}
		return false;
	}

	// Dynamic Garbage Collection: Deletes any file on disk that isn't present in the active queue array
	cleanStaleCache(activeQueueIds) {
		try {
			const physicalFiles = fs.readdirSync(cacheDir);
			
			for (const fileName of physicalFiles) {
				const ext = path.extname(fileName);
				const videoId = path.basename(fileName, ext);

				if (fileName.startsWith('.')) continue;

				const isStillNeeded = activeQueueIds.includes(videoId);
				const isActivelyWriting = this.activeDownloads.has(videoId);

				if (!isStillNeeded && !isActivelyWriting) {
					const targetPath = path.join(cacheDir, fileName);
					fs.unlinkSync(targetPath);
					pino.info(`[DownloadManager] Cleaned up stale, orphaned video asset: ${fileName}`);
				}
			}
		} catch (error) {
			pino.error(`[DownloadManager] Maintenance sweep exception: ${error.message}`);
		}
	}

	async downloadVideo(videoId, quality = 1080) {
		if (this.isDownloaded(videoId) || this.activeDownloads.has(videoId)) {
			return Promise.resolve();
		}

		this.activeDownloads.add(videoId);
		pino.info(`[DownloadManager] Starting pre-download for YouTube ID: ${videoId}`);

		try {
			const url = `https://www.youtube.com/watch?v=${videoId}`;
			const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
			const cookieFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';
			
			const outputTemplate = path.join(cacheDir, videoId);
			const command = `yt-dlp -f "bestvideo[height<=${quality}]+bestaudio/best/best" --merge-output-format mp4 ${cookieFlag} --no-warnings -o "${outputTemplate}.%(ext)s" "${url}"`;

			await execPromise(command, { maxBuffer: 1024 * 1024 * 20 });
			// pino.info(`[DownloadManager] Successfully downloaded and merged video to: ${this.getFilePath(videoId)}`);
		} catch (error) {
			pino.error(`[DownloadManager] Failed downloading video ${videoId}: ${error.message}`);
			this.deleteDownloadedVideo(videoId);
		} finally {
			this.activeDownloads.delete(videoId);
		}
	}

	deleteDownloadedVideo(videoId) {
		for (const ext of this.extensions) {
			const filePath = path.join(cacheDir, `${videoId}${ext}`);
			if (fs.existsSync(filePath)) {
				try {
					fs.unlinkSync(filePath);
					// pino.info(`[DownloadManager] Deleted cached video file: ${filePath}`);
				} catch (err) {
					pino.error(`[DownloadManager] Error deleting file ${filePath}: ${err.message}`);
				}
			}
		}
	}
}

export default new DownloadManager();