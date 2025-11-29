import Joi from 'joi';
import VideoQueue from '~/queue/VideoQueue.js';
import Config from '~/utils/Config.js';
import PlaylistDatabase from '~/db/PlaylistDatabase.js';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class AddRandomPlaylistToQueueMiddleware extends AbstractEndpoint {
	setup () {
		this.add(this.addRandomPlaylistToQueue);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				use_entire_random_playlist: Joi.boolean(),
				playlist_id: Joi.number().required(),
			}),
		});
	}

	async addRandomPlaylistToQueue (ctx, next) {
		try {
			const playlist = await this.fetchPlaylist(ctx.request.body);

			if (!playlist || !playlist.videos?.length) {
				return super.error(ctx, 'Playlist not found or contains no videos');
			}

			await VideoQueue.add(this.formatVideos(playlist));
			return super.success(ctx, next, 'Playlist videos added to queue');
		} catch (error) {
			return super.error(ctx, error);
		}
	}
}
export async function fetchPlaylist ({ use_entire_random_playlist, playlist_id }) {
	if (use_entire_random_playlist || Config.useEntireRandomPlaylist) {
		const playlists = await PlaylistDatabase.getAllPlaylists();
		if (!playlists?.length) throw new Error('No playlists available');

		const randomPlaylist = playlists[Math.floor(Math.random() * playlists.length)];
		return PlaylistDatabase.getPlaylistWithVideosAndGames(randomPlaylist.id);
	}

	if (!playlist_id) throw new Error('Playlist ID is required');
	return PlaylistDatabase.getPlaylistWithVideosAndGames(playlist_id);
}

export function formatVideos ({ videos, videoInfo, gameInfo }) {
	return videos.map(video => {
		const info = videoInfo[video.id] || {};
		return {
			id: info.id,
			title: info.title || 'Unknown Title',
			thumbnail_url: info.thumbnail_url || '',
			length: info.length || 0,
			game: gameInfo[info.gameId] || { id: 'unknown', title: 'Unknown Game' },
			source_type: info.source_type,
		};
	});
}

export default new AddRandomPlaylistToQueueMiddleware().middlewares();