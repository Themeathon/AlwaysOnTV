import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';

class GetAllGames extends AbstractEndpoint {
	setup () {
		this.add(this.getAllGames);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				orderBy: Joi.string().valid('asc', 'desc'),
			}),
		});
	}

	async getAllGames (ctx, next) {
		try {
			let order = 'asc';

			const { orderBy } = ctx.params;
			if (orderBy && orderBy === 'desc') {
				order = 'desc';
			}

			return super.success(ctx, next, await GameDatabase.getAllGames(order));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetAllGames().middlewares();