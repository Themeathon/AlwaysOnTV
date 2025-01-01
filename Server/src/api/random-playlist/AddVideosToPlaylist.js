import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';

class AddVideosToPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.addVideosToPlaylist);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				videoIds: Joi.alternatives().try(
					Joi.string(),
					Joi.array().items(Joi.string()),
				).required(),
			}),
		});
	}

	async addVideosToPlaylist (ctx, next) {
		try {
			const { videoIds } = ctx.request.body;

			const data = await RandomPlaylistDatabase.addVideos(videoIds);

			return super.success(ctx, next, data);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddVideosToPlaylist().middlewares();