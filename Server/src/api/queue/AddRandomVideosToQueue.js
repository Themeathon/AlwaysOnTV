import Joi from 'joi';

import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class AddRandomVideosToQueue extends AbstractEndpoint {
	setup () {
		this.add(this.addRandomVideosToQueue);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				amount: Joi.number().required().min(1).max(10),
			}),
		});
	}

	async addRandomVideosToQueue (ctx, next) {
		try {
			const { amount } = ctx.request.body;

			const videos = await VideoQueue.getRandomVideo(amount);

			return super.success(ctx, next, await VideoQueue.add(videos));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddRandomVideosToQueue().middlewares();