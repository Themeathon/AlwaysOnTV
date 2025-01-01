import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';

class GetPlaylistByID extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.getPlaylistByID);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
		});
	}

	async checkPlaylist (ctx, next) {
		const playlistId = ctx.params.id;

		const playlist = await PlaylistDatabase.getPlaylistWithVideosAndGames(playlistId);
		if (!playlist) {
			return super.error(ctx, `Couldn't find playlist with ID ${playlistId}`);
		}

		ctx.playlist = playlist;

		return next();
	}

	async getPlaylistByID (ctx, next) {
		try {
			return super.success(ctx, next, ctx.playlist);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetPlaylistByID().middlewares();