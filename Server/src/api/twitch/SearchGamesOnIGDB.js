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

			return super.success(ctx, next, await Twitch.searchGamesOnIGDB(name, offset));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new SearchGamesOnIGDB().middlewares();