import AbstractDatabase from './AbstractDatabase.js';

import GameDatabase from '~/db/GameDatabase.js';
import pino from '~/utils/Pino.js';

class PlaylistDatabase extends AbstractDatabase {
	constructor () {
		super('playlists');
	}

	async createTable () {
		super.createTable();

		if (await this.doesTableExist()) return;

		await this.knex.schema.createTable(this.table_name, table => {
			table.increments('id').notNullable().comment('Incremental Playlist ID');

			table.timestamp('created_at').notNullable().defaultTo(this.knex.fn.now()).comment('Playlist Creation Date');

			table.string('title').unique().notNullable().defaultTo(null).comment('Playlist Title');
		});
	}

	async getAllPlaylists () {
		const playlists = await this.getKnex()
			.select('playlists.id', 'playlists.title')
			.leftJoin('playlist_videos', 'playlists.id', 'playlist_videos.playlistId')
			.leftJoin('videos', 'playlist_videos.videoId', 'videos.id')
			.groupBy('playlists.id')
			.orderBy('playlists.id')
			.count('playlist_videos.videoId as videoCount')
			.sum('videos.length as playlistLength')
			.orderBy('playlist_videos.index')
			.select('videos.thumbnail_url');

		return playlists;
	}

	async getByTitle (title) {
		return await this.getKnex()
			.select('*')
			.whereRaw('LOWER(title) LIKE LOWER(?)', title)
			.first();
	}

	/**
	 *
	 * @param {*} title
	 * The playlist title
	 * @param {*} youTubePlaylist
	 * A ytpl playlist object
	 * @param {*} addNewToRandomPlaylist
	 * Whether to add videos that aren't in the database yet to the random playlist
	 * @param {*} gameId
	 * The game ID for the newly created games - "Always On" by default
	 * @returns
	 */
	async createPlaylist (
		title,
		youTubePlaylist = false,
		addNewToRandomPlaylist = true,
		gameId = GameDatabase.getDefaultGameID(),
	) {
		if (!title && !youTubePlaylist) return false;

		if (youTubePlaylist) {
			try {
				const playlist = youTubePlaylist;

				await this.knex.transaction(async trx => {
					// Create the playlist
					const [playlistId] = await trx(this.table_name)
						.insert({ title: playlist.title });

					// Iterate over the videos we want to add
					for (const video of playlist.videos) {
						// Fetch the video to see if we already have it in the database
						const dbVideo = await trx('videos')
							.select('id', 'length')
							.where('id', video.id)
							.first();

						// If we don't have it in the database, add it
						if (!dbVideo) {
							await trx('videos')
								.insert({
									id: video.id,
									title: video.title,
									thumbnail_url: video.thumbnail_url,
									length: video.length,
									gameId,
									sourceType: video.sourceType,
								});

							// If new videos that aren't yet in the database should be added to the random playlist
							if (addNewToRandomPlaylist) {
								await trx('random_playlist')
									.insert({ videoId: video.id });
							}
						}
						// v1.1.0 update patch, will be removed in a newer version. Maybe v1.2.0
						else if (!dbVideo.length) {
							await trx('videos')
								.where({ id: video.id })
								.update({ length: video.length });
						}

						// Get the latest index for the playlist
						const results = (await trx('playlist_videos')
							.select('index')
							.where({ playlistId })
							.orderBy('index', 'desc')
							.limit(1)
						)[0];

						// A lil' bit of math
						const index = results?.index + 1 || 1;

						// Insert the video in the playlist videos table
						await trx('playlist_videos')
							.insert({
								playlistId,
								index,
								videoId: video.id,
							});
					}
				});
			}
			catch (error) {
				pino.error('Error in PlaylistDatabase.createPlaylist');
				pino.error(error);
				throw error;
			}
		}
		else {
			if (await this.getByTitle(title)) {
				return false;
			}

			await this.insert({
				title,
			});
		}

		return this.getByTitle(title);
	}

	async updatePlaylist (id, title) {
		if (!id || !title) return false;

		const playlist = await super.getByID(id);
		if (!playlist) {
			return false;
		}

		await this.update({
			id,
		}, {
			title,
		});

		return super.getByID(id);
	}

	async deletePlaylist (id, force = false) {
		if (!id) return false;

		const playlist = await super.getByID(id);
		if (!playlist) {
			return false;
		}

		if (force) {
			try {
				await this.knex.transaction(async trx => {
					await trx('playlist_videos')
						.where('playlistId', id)
						.del();
				});
			}
			catch (error) {
				pino.error('Error in PlaylistDatabase.deletePlaylist');
				pino.error(error);
				throw error;
			}
		}

		return this.delete({
			id,
		});
	}

	async getPlaylistWithVideosAndGames (id) {
		if (!id) return false;

		const result = await this.knex
			.select(
				'playlists.id as id',
				'playlists.created_at as created_at',
				'playlists.title as title',
				'videos.id as videos:id',
				'videos.title as videos:title',
				'videos.thumbnail_url as videos:thumbnail_url',
				'videos.gameId as videos:gameId',
				'videos.length as videos:length',
				'videos.source_type as videos:source_type',
				'playlist_videos.index as videos:index',
				'games.id as games:id',
				'games.title as games:title',
			)
			.from('playlists')
			.where('playlists.id', id)
			.leftJoin('playlist_videos', 'playlists.id', 'playlist_videos.playlistId')
			.leftJoin('videos', 'playlist_videos.videoId', 'videos.id')
			.leftJoin('games', 'videos.gameId', 'games.id')
			.orderBy('playlist_videos.index', 'asc');

		if (result.length === 0) {
			return false;
		}

		const playlistData = {
			id: result[0].id,
			created_at: result[0].created_at,
			title: result[0].title,
			thumbnail_url: null,
			videos: [],
			videoInfo: {},
			gameInfo: {},
		};

		for (const row of result) {
			if (!row['videos:id']) continue;

			// --- Video order in the playlist

			const video = {
				id: row['videos:id'],
				index: row['videos:index'],
			};

			playlistData.videos.push(video);

			// --- Video info

			const videoInfo = {
				id: row['videos:id'],
				title: row['videos:title'],
				thumbnail_url: row['videos:thumbnail_url'],
				length: row['videos:length'],
				gameId: row['videos:gameId'],
				source_type: row['videos:source_type'],
			};

			if (!playlistData.thumbnail_url) {
				playlistData.thumbnail_url = videoInfo.thumbnail_url;
			}

			if (!playlistData.videoInfo[videoInfo.id]) {
				playlistData.videoInfo[videoInfo.id] = videoInfo;
			}

			// --- Game info

			const gameInfo = {
				id: row['games:id'],
				title: row['games:title'],
			};

			if (!playlistData.gameInfo[gameInfo.id]) {
				playlistData.gameInfo[gameInfo.id] = gameInfo;
			}
		}

		return playlistData;
	}
}

export default new PlaylistDatabase();