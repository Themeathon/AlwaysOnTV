import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import fs from 'node:fs';
import pino from '~/utils/Pino.js';
import Joi from 'joi';
import path from 'node:path';
import { pipeline } from 'node:stream';
import DownloadManager from '~/utils/ytdl/DownloadManager.js';

class StreamLocalVideo extends AbstractEndpoint {
	setup () {
		this.add(this.streamVideo);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.string().required(),
			}),
		});
	}

	async streamVideo (ctx, next) {
		const videoId = ctx.params.id;
		let filePath = null;

		const video = await VideoDatabase.tryGet({ id: videoId, source_type: 'local' });

		if (video && video.file_path) {
			filePath = video.file_path;
		} else if (DownloadManager.isDownloaded(videoId)) {
			filePath = DownloadManager.getFilePath(videoId); 
		}

		if (!filePath) {
			return super.error(ctx, 'Video file not found', 404);
		}

		try {
			const stats = await fs.promises.stat(filePath);
			const fileSize = stats.size;
			const range = ctx.request.headers.range;

			ctx.set('Accept-Ranges', 'bytes');

			if (range) {
				const parts = range.replace(/bytes=/, '').split('-');
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

				if(start >= fileSize) {
					ctx.status = 416;
					ctx.set('Content-Range', `bytes */${fileSize}`);
					return;
				}

				const chunksize = (end - start) + 1;
				const fileStream = fs.createReadStream(filePath, { start, end });

				ctx.status = 206;
				ctx.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
				ctx.set('Content-Length', chunksize);

				const ext = path.extname(filePath).toLowerCase();
				if (ext === '.mp4') ctx.set('Content-Type', 'video/mp4');
				else if (ext === '.webm') ctx.set('Content-Type', 'video/webm');
				else if (ext === '.mkv') ctx.set('Content-Type', 'video/x-matroska');
				else if (ext === '.avi') ctx.set('Content-Type', 'video/x-msvideo');
				else if (ext === '.mov') ctx.set('Content-Type', 'video/quicktime');
				else ctx.set('Content-Type', 'application/octet-stream');

				// This catches client aborts cleanly, skipping the framework's default crash catcher
				pipeline(fileStream, ctx.res, (err) => {
					if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
						pino.error(`[StreamLocalVideo] Range Pipeline error for ${filePath}: ${err.message}`);
					}
				});

				// Tell Koa we are explicitly bypassing manual ctx.body assignments to let pipeline handle it
				ctx.respond = false;

			} else {
				ctx.status = 200;
				ctx.set('Content-Length', fileSize);

				const ext = path.extname(filePath).toLowerCase();
				if (ext === '.mp4') ctx.set('Content-Type', 'video/mp4');
				else if (ext === '.webm') ctx.set('Content-Type', 'video/webm');
				else if (ext === '.mkv') ctx.set('Content-Type', 'video/x-matroska');
				else if (ext === '.avi') ctx.set('Content-Type', 'video/x-msvideo');
				else if (ext === '.mov') ctx.set('Content-Type', 'video/quicktime');
				else ctx.set('Content-Type', 'application/octet-stream');

				const fileStream = fs.createReadStream(filePath);

				pipeline(fileStream, ctx.res, (err) => {
					if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
						pino.error(`[StreamLocalVideo] Full Pipeline error for ${filePath}: ${err.message}`);
					}
				});

				ctx.respond = false;
			}

		} catch (error) {
			if (error.code === 'ENOENT') {
				return super.error(ctx, 'Video file not found on server', 404);
			}
			pino.error(`Error streaming file ${filePath}: ${error.message}`);
			return super.error(ctx, 'Error streaming video file', 500);
		}
	}
}

export default new StreamLocalVideo().middlewares();