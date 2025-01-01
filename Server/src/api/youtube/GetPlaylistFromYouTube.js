import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import YTDL from '~/utils/ytdl/index.js';

class GetPlaylistFromYouTube extends AbstractEndpoint {
	setup () {
		this.add(this.getPlaylistFromYouTube);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				playlistId: Joi.string().required(),
			}),
		});
	}

	async getPlaylistFromYouTube (ctx, next) {
		try {
			const { playlistId } = ctx.request.body;

			return super.success(ctx, next, await YTDL.getPlaylist(playlistId, false));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetPlaylistFromYouTube().middlewares();