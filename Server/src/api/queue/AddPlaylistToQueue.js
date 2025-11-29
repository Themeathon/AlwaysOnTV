import Joi from 'joi';

import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class AddPlaylistToQueue extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.addPlaylistToQueue);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				playlistId: Joi.number().required(),
			}),
		});
	}

	async checkPlaylist (ctx, next) {
		const { playlistId } = ctx.request.body;

		const playlist = await PlaylistDatabase.getPlaylistWithVideosAndGames(playlistId);
		if (!playlist) {
			return super.error(ctx, `Couldn't find playlist with ID ${playlistId}`);
		}

		ctx.playlist = playlist;

		return next();
	}

	async addPlaylistToQueue (ctx, next) {
		try {
			const playlist = ctx.playlist;

			const videos = [];
			for (const video of playlist.videos) {
				const tempVideo = {
					...playlist.videoInfo[video.id],
				};

				videos.push({
					id: tempVideo.id,
					title: tempVideo.title,
					thumbnail_url: tempVideo.thumbnail_url,
					length: tempVideo.length,
					game: playlist.gameInfo[tempVideo.gameId],
					source_type: tempVideo.source_type,
				});
			}

			return super.success(ctx, next, await VideoQueue.add(videos));
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddPlaylistToQueue().middlewares();