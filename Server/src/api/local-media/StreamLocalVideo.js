import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import VideoDatabase from '~/db/VideoDatabase.js';
import fs from 'node:fs';
import pino from '~/utils/Pino.js';
import Joi from 'joi';
import path from 'node:path';

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

		const video = await VideoDatabase.tryGet({ id: videoId, source_type: 'local' });

		if (!video || !video.file_path) {
			return super.error(ctx, 'Local video not found', 404);
		}

		const filePath = video.file_path;

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

				ctx.body = fileStream;

				fileStream.on('error', (err) => {
					pino.error(`Error reading file stream for ${filePath}: ${err.message}`);
					ctx.res.end();
				});

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
				ctx.body = fileStream;

				fileStream.on('error', (err) => {
					pino.error(`Error reading file stream for ${filePath}: ${err.message}`);
					ctx.res.end();
				});
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