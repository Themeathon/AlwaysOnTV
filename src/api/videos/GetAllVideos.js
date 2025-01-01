import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import VideoDatabase from '~/db/VideoDatabase.js';

class GetAllVideos extends AbstractEndpoint {
	setup () {
		this.add(this.getAllVideos);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				orderBy: Joi.string().valid('asc', 'desc'),
			}),
		});
	}

	async getAllVideos (ctx, next) {
		try {
			let order = 'asc';

			const { orderBy } = ctx.params;
			if (orderBy && orderBy === 'desc') {
				order = 'desc';
			}

			return super.success(ctx, next, await VideoDatabase.getAllVideos(order));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetAllVideos().middlewares();