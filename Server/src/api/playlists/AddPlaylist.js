import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';

import YTDL from '~/utils/ytdl/index.js';

class AddPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.checkGame);
		this.add(this.addPlaylist);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				title: Joi.string(),
				gameId: Joi.string().default(GameDatabase.getDefaultGameID()),
				youTubePlaylistID: Joi.string(),
				addNewToRandomPlaylist: Joi.bool().default(true),
			}).or('title', 'youTubePlaylistID'),
		});
	}

	async checkPlaylist (ctx, next) {
		const { title, youTubePlaylistID } = ctx.request.body;

		ctx.title = title;
		if (youTubePlaylistID) {
			// Get only the title first for a faster error
			ctx.youTubePlaylist = await YTDL.getPlaylist(youTubePlaylistID, false);

			ctx.title = ctx.youTubePlaylist.title;
		}

		if ((await PlaylistDatabase.getByTitle(ctx.title))) {
			return super.error(ctx, `Playlist with title "${ctx.title}" already exists`);
		}

		if (youTubePlaylistID) {
			// Then get the playlist with all videos
			ctx.youTubePlaylist = await YTDL.getPlaylist(youTubePlaylistID);
		}

		return next();
	}

	async checkGame (ctx, next) {
		const { gameId } = ctx.request.body;

		if (!gameId) return next();

		const game = await GameDatabase.getByID(gameId);
		if (!game) {
			return super.error(ctx, `Couldn't find game with ID ${gameId}`);
		}

		return next();
	}

	async addPlaylist (ctx, next) {
		try {
			const { title, youTubePlaylist } = ctx;
			const { addNewToRandomPlaylist, gameId } = ctx.request.body;

			const result = await PlaylistDatabase.createPlaylist(title, youTubePlaylist, addNewToRandomPlaylist, gameId);
			if (!result) {
				return super.error(ctx, 'Failed to add playlist');
			}

			return super.success(ctx, next, result);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddPlaylist().middlewares();