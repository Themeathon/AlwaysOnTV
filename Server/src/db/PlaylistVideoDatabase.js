import AbstractDatabase from './AbstractDatabase.js';
import pino from '~/utils/Pino.js';

class PlaylistDatabase extends AbstractDatabase {
	constructor () {
		super('playlist_videos');
	}

	async createTable () {
		super.createTable();

		if (await this.doesTableExist()) return;

		await this.knex.schema.createTable(this.table_name, table => {
			table.integer('playlistId')
				.notNullable().defaultTo(null)
				.references('id').inTable('playlists')
				.onUpdate('RESTRICT').onDelete('RESTRICT')
				.comment('Playlist Reference ID');
			table.integer('index')
				.notNullable().defaultTo(null)
				.comment('The index in the playlist');
			table.string('videoId')
				.notNullable().defaultTo(null)
				.references('id').inTable('videos')
				.onUpdate('RESTRICT').onDelete('RESTRICT')
				.comment('Video Reference ID');

			// A playlist should not have multiple entries on the same index.
			// However, the same video multiple times is supported.
			table.unique(['playlistId', 'index']);
		});
	}

	async getLatestIndex (playlistId) {
		const results = (await this.getKnex()
			.select('index')
			.where({ playlistId })
			.orderBy('index', 'desc')
			.limit(1)
		)[0];

		return results?.index || 0;
	}

	async fixPlaylistPositions (playlistId) {
		try {
			await this.knex.transaction(async trx => {
				const rows = await trx(this.table_name)
					.select('index')
					.where({ playlistId })
					.orderBy('index', 'asc');

				let newIndex = 1;
				for (const row of rows) {
					await trx(this.table_name)
						.where({ playlistId, index: row.index })
						.update({ index: newIndex++ });
				}
			});

			return true;
		}
		catch (error) {
			pino.error('Error in PlaylistVideoDatabase.fixPlaylistPositions');
			pino.error(error);
			return false;
		}
	}

	async addVideosToPlaylist (playlistId, videoIds) {
		if (!playlistId || !videoIds || videoIds.length === 0) return false;

		try {
			await this.knex.transaction(async trx => {
				const results = (await trx(this.table_name)
					.select('index')
					.where({ playlistId })
					.orderBy('index', 'desc')
					.limit(1)
			)[0];

			let newIndex = (results?.index || 0) + 1;

			const insertions = videoIds.map(videoId => ({
					playlistId,
					index: newIndex++,
					videoId,
			}));

			if (insertions.length > 0) {
				await trx(this.table_name).insert(insertions);
			}
		});

		await this.fixPlaylistPositions(playlistId);

		return true;
	} catch (error) {
		pino.error('Error in PlaylistVideoDatabase.addVideosToPlaylist');
		pino.error(error);
		throw error;
		}
	}

	async deleteVideoFromPlaylist (playlistId, index) {
		if (!playlistId || !index) return false;

		if (!(await this.tryGet({ playlistId, index }))) {
			return false;
		}

		await this.delete({
			playlistId,
			index,
		});

		await this.fixPlaylistPositions(playlistId);

		return true;
	}

	async moveVideoToIndex (playlistId, oldIndex, newIndex) {
		if (!playlistId || !oldIndex || !newIndex) return false;
		if (oldIndex === newIndex) return true;

		if (!(await this.tryGet({ playlistId, index: oldIndex }))) {
			return false;
		}

		try {
			await this.knex.transaction(async trx => {
				await trx(this.table_name)
					.where({ playlistId, index: oldIndex })
					.update({ index: -1 });

				if (newIndex < oldIndex) {
					const affected = await trx(this.table_name)
						.where({ playlistId })
						.whereBetween('index', [newIndex, oldIndex - 1])
						.orderBy('index', 'desc');

					for (const row of affected) {
						await trx(this.table_name)
							.where({ playlistId, index: row.index })
							.increment('index', 1);
					}
				} else {
					const affected = await trx(this.table_name)
						.where({ playlistId })
						.whereBetween('index', [oldIndex + 1, newIndex])
						.orderBy('index', 'asc');

					for (const row of affected) {
						await trx(this.table_name)
							.where({ playlistId, index: row.index })
							.decrement('index', 1);
					}
				}

				await trx(this.table_name)
					.where({ playlistId, index: -1 })
					.update({ index: newIndex });
			});

			await this.fixPlaylistPositions(playlistId);

			return true;
		}
		catch (error) {
			pino.error('Error in PlaylistVideoDatabase.moveVideoToIndex');
			pino.error(error);
			return false;
		}
	}
}

export default new PlaylistDatabase();