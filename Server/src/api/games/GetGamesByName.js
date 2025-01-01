import Joi from 'joi';

import GameDatabase from '~/db/GameDatabase.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class GetGamesByName extends AbstractEndpoint {
	setup () {
		this.add(this.getGamesByName);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				title: Joi.string().required(),
			}),
		});
	}

	async getGamesByName (ctx, next) {
		try {
			const { title } = ctx.request.body;

			return super.success(ctx, next, await GameDatabase.getGamesByName(title));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetGamesByName().middlewares();