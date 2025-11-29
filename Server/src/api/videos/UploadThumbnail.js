import Joi from 'joi';
import fs from 'node:fs/promises';
import path from 'node:path';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import VideoDatabase from '~/db/VideoDatabase.js';

class UploadThumbnail extends AbstractEndpoint {
	setup () {
		this.add(this.checkVideo);
		this.add(this.uploadThumbnail);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.string().required(),
			}),
		});
	}

	async checkVideo (ctx, next) {
		const videoId = ctx.params.id;
		const video = await VideoDatabase.getByID(videoId);

		if (!video) {
			return super.error(ctx, `Couldn't find video with ID ${videoId}`);
		}
		ctx.videoId = videoId;
		return next();
	}

	async uploadThumbnail (ctx, next) {
		try {
			const file = ctx.request.files?.thumbnail;
			if (!file) {
				return super.error(ctx, 'No thumbnail file uploaded');
			}

			const ext = path.extname(file.originalFilename).toLowerCase();
			const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

			if (!allowedExtensions.includes(ext)) {
				return super.error(ctx, 'Invalid file type. Only images are allowed.');
			}

			const fileName = `${ctx.videoId}${ext}`;
			const publicPath = `/thumbnails/${fileName}`;
			const targetPath = path.join(process.cwd(), 'public', 'thumbnails', fileName);

			await fs.mkdir(path.dirname(targetPath), { recursive: true });

			await fs.copyFile(file.filepath, targetPath);
			await fs.unlink(file.filepath).catch(() => {});

			await VideoDatabase.updateVideo(ctx.videoId, {
				thumbnail_url: publicPath,
			});

			return super.success(ctx, next, {
				thumbnail_url: publicPath,
			});
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UploadThumbnail().middlewares();