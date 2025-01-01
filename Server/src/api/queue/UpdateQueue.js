import Joi from 'joi';

import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class UpdateQueue extends AbstractEndpoint {
	setup () {
		this.add(this.updateQueue);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				index: Joi.number().required(),
				newIndex: Joi.alternatives().try(
					Joi.number(),
					Joi.string().valid('start', 'end'),
				).required(),
			}),
		});
	}

	async updateQueue (ctx, next) {
		try {
			const { index, newIndex } = ctx.request.body;

			const result = await VideoQueue.move(index, newIndex);

			return super.success(ctx, next, result);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateQueue().middlewares();