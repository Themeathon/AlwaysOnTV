import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Twitch from '~/utils/Twitch.js';

class SearchGamesOnIGDB extends AbstractEndpoint {
	setup () {
		this.add(this.searchGamesOnIGDB);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				name: Joi.string().required(),
				offset: Joi.number().min(0).default(0),
			}),
		});
	}

	async searchGamesOnIGDB (ctx, next) {
		try {
			const { name, offset } = ctx.request.body;

			if (name.startsWith('id=') && name.length >= 3) {
				const twitchId = name.substring(3);
				const twitchGameList = await Twitch.getGamesByTwitchID(twitchId);

				const igdbFormattedList = twitchGameList.map(twitchGame => {
					const thumbnailUrl = twitchGame.box_art_url.replace('{width}x{height}', '500x700');

					return {
						id: twitchGame.igdb_id,
						name: twitchGame.name,
						cover: {
							url: thumbnailUrl,
						},
						external_games: [
							{ category: 14, uid: twitchGame.id },
						],
					};
				});
				return super.success(ctx, next, igdbFormattedList);
			} else {
				return super.success(ctx, next, await Twitch.searchGamesOnIGDB(name, offset));
			}
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new SearchGamesOnIGDB().middlewares();