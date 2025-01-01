import Joi from 'joi';

import GameDatabase from '~/db/GameDatabase.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class UpdateGameByID extends AbstractEndpoint {
	setup () {
		this.add(this.checkGame);
		this.add(this.updateGameByID);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.string().required(),
			}),
			body: Joi.object({
				title: Joi.string(),
				thumbnail_url: Joi.string(),
			}).or('title', 'thumbnail_url'),
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

	async updateGameByID (ctx, next) {
		try {
			const gameId = ctx.gameId;

			const { title, thumbnail_url } = ctx.request.body;

			return super.success(ctx, next,
				await GameDatabase.updateGame(gameId, {
					title,
					thumbnail_url,
				}),
			);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateGameByID().middlewares();