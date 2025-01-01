import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';

class DeletePlaylistByID extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.deletePlaylistByID);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				force: Joi.bool().default(false),
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

	async deletePlaylistByID (ctx, next) {
		const playlistId = ctx.playlistId;
		const { force } = ctx.request.body;

		try {
			const status = await PlaylistDatabase.deletePlaylist(playlistId, force);
			if (status === true) {
				return super.success(ctx, next);
			}
			else {
				return super.error(ctx, `Failed to delete playlist with ID ${playlistId}`);
			}
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new DeletePlaylistByID().middlewares();