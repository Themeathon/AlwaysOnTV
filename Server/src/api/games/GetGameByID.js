import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';

class GetGameByID extends AbstractEndpoint {
	setup () {
		this.add(this.checkGame);
		this.add(this.getGameByID);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.string().required(),
			}),
		});
	}

	async checkGame (ctx, next) {
		const gameId = ctx.params.id;

		const game = await GameDatabase.getByID(gameId);
		if (!game) {
			return super.error(ctx, `Couldn't find game with ID ${gameId}`);
		}

		ctx.game = game;

		return next();
	}

	async getGameByID (ctx, next) {
		try {
			const game = ctx.game;

			return super.success(ctx, next, game);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetGameByID().middlewares();