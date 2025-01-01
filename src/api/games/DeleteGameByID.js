import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';

class DeleteGameByID extends AbstractEndpoint {
	setup () {
		this.add(this.checkGame);
		this.add(this.deleteGameByID);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.string().required().not('499973'),
			}),
			body: Joi.object({
				force: Joi.bool().default(false),
			}),
		});
	}

	async checkGame (ctx, next) {
		const gameId = ctx.params.id;

		const game = await GameDatabase.getByID(gameId);
		if (!game) {
			return super.error(ctx, `Couldn't find game with ID ${gameId}`);
		}

		ctx.gameId = gameId;

		return next();
	}

	async deleteGameByID (ctx, next) {
		try {
			const gameId = ctx.gameId;
			const { force } = ctx.request.body;

			const status = await GameDatabase.deleteGame(gameId, force);
			if (status === true) {
				return super.success(ctx, next);
			}
			else {
				return super.error(ctx, `Failed to delete game with ID ${gameId}`);
			}
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new DeleteGameByID().middlewares();