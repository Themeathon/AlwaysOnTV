import Joi from 'joi';

import Config, { TwitchConfig } from '~/utils/Config.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class UpdateSettings extends AbstractEndpoint {
	setup () {
		this.add(this.updateSettings);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				twitch_enabled: Joi.bool(),
				client_id: Joi.string().allow(null, ''),
				client_secret: Joi.string().allow(null, ''),
				title_replacement: Joi.string(),
				use_random_playlist: Joi.bool(),
				max_video_quality: Joi.number().allow(360, 480, 720, 1080, 1440, 2160),
			}).or(
				'twitch_enabled',
				'client_id',
				'client_secret',
				'title_replacement',
				'use_random_playlist',
				'max_video_quality',
			),
		});
	}

	async updateSettings (ctx, next) {
		try {
			const {
				twitch_enabled,
				client_id,
				client_secret,
				title_replacement,
				use_random_playlist,
				max_video_quality,
			} = ctx.request.body;

			TwitchConfig.isEnabled = twitch_enabled;
			TwitchConfig.titleReplacement = title_replacement;
			TwitchConfig.clientID = client_id;
			TwitchConfig.clientSecret = client_secret;

			Config.useRandomPlaylist = use_random_playlist;
			Config.maxVideoQuality = max_video_quality;

			return super.success(ctx, next, {
				updated: {
					twitch_enabled,
					client_id,
					client_secret,
					title_replacement,
					use_random_playlist,
					max_video_quality,
				},
			});
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateSettings().middlewares();