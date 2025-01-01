import Joi from 'joi';

import VideoDatabase from '~/db/VideoDatabase.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class AddVideoToQueue extends AbstractEndpoint {
	setup () {
		this.add(this.checkVideo);
		this.add(this.getVideoByID);
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

		const video = await VideoDatabase.getVideo(videoId);
		if (!video) {
			return super.error(ctx, `Couldn't find video with ID ${videoId}`);
		}

		ctx.video = video;

		return next();
	}

	async getVideoByID (ctx, next) {
		try {
			const video = ctx.video;

			return super.success(ctx, next, video);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddVideoToQueue().middlewares();