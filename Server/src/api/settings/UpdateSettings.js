import Joi from 'joi';
import Config, {LocalMediaConfig, TwitchConfig} from '#utils/Config.js';
import UpdateChecker from '#utils/UpdateChecker.js';
import AbstractEndpoint from '../AbstractEndpoint.js';

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
				prefetch_queue_amount: Joi.number().min(1).max(10),
				youtube_playback_mode: Joi.string().valid('stream', 'download'),
				local_base_paths: Joi.array().items(Joi.string().allow('')).optional(),
				password_enabled: Joi.bool(),
				password: Joi.string().min(1),
				update_check_enabled: Joi.bool(),
			}).or(
				'twitch_enabled',
				'client_id',
				'client_secret',
				'title_replacement',
				'use_random_playlist',
				'use_entire_random_playlist',
				'max_video_quality',
				'prefetch_queue_amount',
				'youtube_playback_mode',
				'local_base_paths',
				'password_enabled',
				'password',
				'update_check_enabled',
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
				prefetch_queue_amount,
				youtube_playback_mode,
				local_base_paths,
				password_enabled,
				password,
				update_check_enabled,
			} = ctx.request.body;

			const updateCheckTurnedOn = update_check_enabled === true && !Config.updateCheckEnabled;

			TwitchConfig.isEnabled = twitch_enabled;
			TwitchConfig.titleReplacement = title_replacement;
			TwitchConfig.clientID = client_id;
			TwitchConfig.clientSecret = client_secret;

			Config.useRandomPlaylist = use_random_playlist;
			Config.useEntireRandomPlaylist = use_entire_random_playlist;
			Config.maxVideoQuality = max_video_quality;
			Config.prefetchQueueAmount = prefetch_queue_amount;
			Config.youtubePlaybackMode = youtube_playback_mode;
			LocalMediaConfig.localBasePaths = local_base_paths;
			Config.password = password;
			Config.passwordEnabled = password_enabled;
			Config.updateCheckEnabled = update_check_enabled;

			if (updateCheckTurnedOn) await UpdateChecker.check();

			return super.success(ctx, next, {
				updated: {
					twitch_enabled,
					client_id,
					client_secret,
					title_replacement,
					use_random_playlist,
					use_entire_random_playlist,
					max_video_quality,
					prefetch_queue_amount,
					youtube_playback_mode,
					local_base_paths,
					password_enabled,
					password_changed: Boolean(password),
					update_check_enabled,
				},
			});
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateSettings().middlewares();