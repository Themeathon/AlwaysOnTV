import VideoDatabase from '~/db/VideoDatabase.js';
import AbstractDatabase from './AbstractDatabase.js';

class RandomPlaylistDatabase extends AbstractDatabase {
	constructor () {
		super('random_playlist');
	}

	async createTable () {
		super.createTable();

		if (await this.doesTableExist()) return;

		await this.knex.schema.createTable(this.table_name, table => {
			table.string('videoId').primary()
				.notNullable().defaultTo(null)
				.references('id').inTable('videos')
				.onUpdate('RESTRICT').onDelete('RESTRICT')
				.comment('Video Reference ID');
		});
	}

	async getRandomVideo (amount = 1) {
		amount = Math.max(amount, 1);
		amount = Math.min(amount, 10);

		const randomVideos = await this.getKnex()
			.select('videoId')
			.orderByRaw('RANDOM()')
			.limit(10);

		if (!randomVideos.length) {
			return false;
		}

		if (amount === 1) return VideoDatabase.getVideo(randomVideos[0].videoId);

		const videos = [];

		for(const video of randomVideos) {
			videos.push(await VideoDatabase.getVideo(video.videoId));
		}

		return videos;
	}

	async getAll () {
		const result = await this.knex
			.select(
				'random_playlist.videoId as videoId',
				'videos.id as videos:id',
				'videos.title as videos:title',
				'videos.thumbnail_url as videos:thumbnail_url',
				'videos.gameId as videos:gameId',
				'videos.length as videos:length',
				'videos.source_type as videos:source_type',
				'games.id as games:id',
				'games.title as games:title',
			)
			.from('random_playlist')
			.leftJoin('videos', 'random_playlist.videoId', 'videos.id')
			.leftJoin('games', 'videos.gameId', 'games.id');

		const playlistData = {
			videoCount: 0,
			playlistLength: 0,
			thumbnail_url: result[0]?.['videos:thumbnail_url'],
			videos: [],
			videoInfo: {},
			gameInfo: {},
		};

		for (const row of result) {
			if (!row['videos:id']) continue;

			playlistData.videoCount++;
			playlistData.playlistLength += row['videos:length'];

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

	async addVideos (videoIds = []) {
		if (!videoIds || !videoIds?.length) return false;

		videoIds = Array.isArray(videoIds) ? videoIds : [videoIds];

		const data = {
			inserted: [],
			failed: [],
		};

		await this.knex.transaction(async trx => {
			const existingVideos = await trx(this.table_name)
				.whereIn('videoId', videoIds)
				.select('videoId');

			const existingVideoIds = existingVideos.map((video) => video.videoId);
			const videosToInsert = videoIds.filter((videoId) => !existingVideoIds.includes(videoId));

			// Check if videosToInsert exist in the 'videos' table
			const videosExist = await trx('videos')
				.whereIn('id', videosToInsert)
				.select('id');

			const existingVideoIdsFromVideosTable = videosExist.map((video) => video.id);
			const videosToInsertFinal = videosToInsert.filter((videoId) => existingVideoIdsFromVideosTable.includes(videoId));

			if (videosToInsertFinal.length > 0) {
				// Insert the new videos
				await trx(this.table_name).insert(videosToInsertFinal.map((videoId) => ({ videoId })));
			}

			data.inserted = videosToInsertFinal;
			data.failed = videoIds.filter((videoId) => !videosToInsertFinal.includes(videoId));
		});

		return data;
	}

	async deleteVideos (videoIds = []) {
		if (!videoIds || !videoIds?.length) return false;

		videoIds = Array.isArray(videoIds) ? videoIds : [videoIds];

		const data = {
			deleted: [],
			failed: [],
		};

		await this.knex.transaction(async trx => {
			for (const videoId of videoIds) {
				const deleteCount = await trx(this.table_name)
					.where('videoId', videoId)
					.del();

				if (deleteCount > 0) {
					data.deleted.push(videoId);
				} else {
					data.failed.push(videoId);
				}
			}
		});

		return data;
	}

	async deleteAllVideos () {
		await this.delete();

		return true;
	}
}

export default new RandomPlaylistDatabase();
