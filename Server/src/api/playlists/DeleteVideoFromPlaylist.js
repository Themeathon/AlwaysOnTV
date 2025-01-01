import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import PlaylistVideoDatabase from '~/db/PlaylistVideoDatabase.js';

class DeleteVideoFromPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.deleteVideoFromPlaylist);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				index: Joi.number().greater(0).required(),
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

	async deleteVideoFromPlaylist (ctx, next) {
		try {
			const playlistId = ctx.playlistId;

			const { index } = ctx.request.body;

			if (!(await PlaylistVideoDatabase.deleteVideoFromPlaylist(playlistId, index))) {
				return super.error(ctx, `No video at index ${index} found`);
			}

			return super.success(ctx, next);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new DeleteVideoFromPlaylist().middlewares();