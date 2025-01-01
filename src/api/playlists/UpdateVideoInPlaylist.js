import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import PlaylistVideoDatabase from '~/db/PlaylistVideoDatabase.js';

class UpdateVideoInPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.updateVideoInPlaylist);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				index: Joi.number().greater(0).required(),
				newIndex: Joi.number().greater(0).required(),
			}),
		});
	}

	async checkPlaylist (ctx, next) {
		const playlistId = ctx.params.id;

		const playlist = await PlaylistDatabase.getPlaylistWithVideosAndGames(playlistId);
		if (!playlist) {
			return super.error(ctx, `Couldn't find playlist with ID ${playlistId}`);
		}

		ctx.playlistId = playlistId;

		return next();
	}

	async updateVideoInPlaylist (ctx, next) {
		try {
			const playlistId = ctx.playlistId;
			const { index, newIndex } = ctx.request.body;

			if (!(await PlaylistVideoDatabase.moveVideoToIndex(playlistId, index, newIndex))) {
				return super.error(ctx, `No video at index ${index} found`);
			}

			return super.success(ctx, next);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateVideoInPlaylist().middlewares();