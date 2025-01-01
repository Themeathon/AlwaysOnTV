import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import PlaylistVideoDatabase from '~/db/PlaylistVideoDatabase.js';
import VideoDatabase from '~/db/VideoDatabase.js';

class AddVideoToPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.checkVideo);
		this.add(this.addVideoToPlaylist);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				videoId: Joi.string().required(),
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

	async checkVideo (ctx, next) {
		const { videoId } = ctx.request.body;

		const video = await VideoDatabase.getVideo(videoId);
		if (!video) {
			return super.error(ctx, `Couldn't find video with ID ${videoId}`);
		}

		ctx.videoId = videoId;

		return next();
	}

	async addVideoToPlaylist (ctx, next) {
		try {
			const playlistId = ctx.playlistId;
			const videoId = ctx.videoId;

			await PlaylistVideoDatabase.addVideoToPlaylist(playlistId, videoId);

			return super.success(ctx, next);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddVideoToPlaylist().middlewares();