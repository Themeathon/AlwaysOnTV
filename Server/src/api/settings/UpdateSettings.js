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
				use_entire_random_playlist: Joi.bool(),
				max_video_quality: Joi.number().allow(360, 480, 720, 1080, 1440, 2160),
				twitch_ad_duration: Joi.number().allow(30, 60, 90, 120, 150, 180),
				twitch_ad_interval: Joi.number().allow(15, 30, 45, 60),
			}).or(
				'twitch_enabled',
				'client_id',
				'client_secret',
				'title_replacement',
				'use_random_playlist',
				'use_entire_random_playlist',
				'max_video_quality',
				'twitch_ad_duration',
				'twitch_ad_interval'
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
				use_entire_random_playlist,
				max_video_quality,
				twitch_ad_duration,
				twitch_ad_interval,
			} = ctx.request.body;

			TwitchConfig.isEnabled = twitch_enabled;
			TwitchConfig.titleReplacement = title_replacement;
			TwitchConfig.clientID = client_id;
			TwitchConfig.clientSecret = client_secret;

			Config.useRandomPlaylist = use_random_playlist;
			Config.useEntireRandomPlaylist = use_entire_random_playlist;
			Config.maxVideoQuality = max_video_quality;
			Config.twitchAdDuration = twitch_ad_duration;
			Config.twitchAdInterval = twitch_ad_interval;

			return super.success(ctx, next, {
				updated: {
					twitch_enabled,
					client_id,
					client_secret,
					title_replacement,
					use_random_playlist,
					use_entire_random_playlist,
					max_video_quality,
					twitch_ad_duration,
					twitch_ad_interval,
				},
			});
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateSettings().middlewares();