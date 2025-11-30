import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import PlaylistVideoDatabase from '~/db/PlaylistVideoDatabase.js';
import VideoDatabase from '~/db/VideoDatabase.js';

class AddVideoToPlaylist extends AbstractEndpoint {
	setup () {
		this.add(this.checkPlaylist);
		this.add(this.checkVideo);
		this.add(this.addVideosToPlaylist);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				id: Joi.number().required(),
			}),
			body: Joi.object({
				videoId: Joi.alternatives().try(
					Joi.string().required(),
					Joi.array().items(Joi.string().required()).min(1).required(),
				).required(),
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
		let { videoId } = ctx.request.body;

		const requestedVideoIds = Array.isArray(videoId) ? videoId : [videoId];

		const existingVideos = await VideoDatabase.selectIn('id', requestedVideoIds);
		const foundDbIds = existingVideos.map(v => v.id);

		const validVideoIdsInOrder = requestedVideoIds.filter(id => foundDbIds.includes(id));

		const missingVideos = requestedVideoIds.filter(id => !foundDbIds.includes(id));

		if (missingVideos.length > 0) {
			return super.error(ctx, `Couldn't find video(s) with ID(s) ${missingVideos.join(', ')}`);
		}

		ctx.videoIds = validVideoIdsInOrder;

		return next();
	}

	async addVideosToPlaylist (ctx, next) {
		try {
			const playlistId = ctx.playlistId;
			const videoIds = ctx.videoIds;

			if (videoIds.length === 0) {
				return super.success(ctx, next, { message: 'No videos to add.'});
			}

			await PlaylistVideoDatabase.addVideosToPlaylist(playlistId, videoIds);

			return super.success(ctx, next);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new AddVideoToPlaylist().middlewares();