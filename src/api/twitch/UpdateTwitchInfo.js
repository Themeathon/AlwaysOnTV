import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Twitch from '~/utils/Twitch.js';

class UpdateTwitchInfo extends AbstractEndpoint {
	setup () {
		this.add(this.updateTwitchInfo);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				title: Joi.string().required(),
				game_id: Joi.number().required(),
			}),
		});
	}

	async updateTwitchInfo (ctx, next) {
		try {
			const { title, game_id } = ctx.request.body;

			const result = await Twitch.updateChannelInformation({ title, game_id });

			if (!result) {
				return super.success(ctx, next);
			}
			else {
				return super.error(ctx, result);
			}
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateTwitchInfo().middlewares();