import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';

class DeleteVideosFromPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.deleteVideosFromPlaylist);
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

	async deleteVideosFromPlaylist (ctx, next) {
		try {
			const { videoIds } = ctx.request.body;

			const data = await RandomPlaylistDatabase.deleteVideos(videoIds);

			return super.success(ctx, next, data);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new DeleteVideosFromPlaylist().middlewares();