import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';
import Twitch from '~/utils/Twitch.js';

class AddGame extends AbstractEndpoint {
	setup () {
		this.add(this.checkGame);
		this.add(this.addGame);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				igdbGameId: Joi.string().required(),
			}),
		});
	}

	async checkGame (ctx, next) {
		const { igdbGameId } = ctx.request.body;

		const twitchGame = await Twitch.getGameByIGDBID(igdbGameId);

		if (!twitchGame) {
			return super.error(ctx, `Couldn't find a game in the Twitch's database with IGDB ID ${igdbGameId}.`);
		}

		const game = await GameDatabase.getByID(twitchGame.id);
		if (game) {
			return super.error(ctx, `Game with ID ${twitchGame.id} already exists.`);
		}

		ctx.game = twitchGame;

		return next();
	}

	async addGame (ctx, next) {
		try {
			const { id, name, box_art_url } = ctx.game;

			return super.success(ctx, next, await GameDatabase.createGame(id, name, this.normalizeBoxart(box_art_url)));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}

	normalizeBoxart (box_art_url) {
		return box_art_url.replace('{width}x{height}', '500x700');
	}
}

export default new AddGame().middlewares();