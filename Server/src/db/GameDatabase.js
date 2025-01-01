import AbstractDatabase from './AbstractDatabase.js';
import pino from '~/utils/Pino.js';

class GameDatabase extends AbstractDatabase {
	constructor () {
		super('games');
	}

	async createTable () {
		super.createTable();

		if (await this.doesTableExist()) return;

		await this.knex.schema.createTable(this.table_name, table => {
			table.string('id').primary().notNullable().defaultTo(null).comment('Twitch Game ID');

			table.timestamp('created_at').notNullable().defaultTo(this.knex.fn.now()).comment('Game Creation Date');

			table.string('title').notNullable().defaultTo(null).comment('Twitch Game Title');

			table.string('thumbnail_url').notNullable().defaultTo(null).comment('Game Thumbnail URL');
		});

		// Add a default game
		await this.createGame('499973', 'Always On', 'https://static-cdn.jtvnw.net/ttv-boxart/499973-500x700.jpg');
	}

	getDefaultGameID () {
		return '499973';
	}

	async getAllGames (orderBy = 'asc') {
		return this.getKnex()
			.select(
				'games.id as id',
				'games.title as title',
				'games.thumbnail_url as thumbnail_url',
			)
			.leftJoin('videos', 'games.id', 'videos.gameId')
			.groupBy('games.id')
			.count('videos.id as videoCount')
			.orderBy('games.title', orderBy);
	}

	async getGamesByName (title) {
		return this.getKnex()
			.select(
				'games.id as id',
				'games.title as title',
				'games.thumbnail_url as thumbnail_url',
			)
			.whereRaw('LOWER(games.title) LIKE LOWER(?)', `%${title}%`)
			.leftJoin('videos', 'games.id', 'videos.gameId')
			.groupBy('games.id')
			.count('videos.id as videoCount');
	}

	async createGame (id, title, thumbnail_url) {
		if (!id || !title || !thumbnail_url) return false;

		if (await super.getByID(id)) {
			return false;
		}

		await this.insert({
			id,
			title,
			thumbnail_url,
		});

		return super.getByID(id);
	}

	async updateGame (id, data) {
		if (!id || !data) return false;

		const game = await super.getByID(id);
		if (!game) {
			return false;
		}

		await this.update({
			id,
		}, data);

		return super.getByID(id);
	}

	async deleteGame (id, force = false) {
		if (!id) return false;

		const game = await super.getByID(id);
		if (!game) {
			return false;
		}

		if (force) {
			try {
				await this.knex.transaction(async trx => {
					// Update all videos that have this game ID to our default
					await trx('videos')
						.where('gameId', id)
						.update({
							gameId: this.getDefaultGameID(),
						});
				});
			}
			catch (error) {
				pino.error('Error in GameDatabase.deleteGame');
				pino.error(error);
				throw error;
			}
		}

		return this.delete({
			id,
		});
	}
}

export default new GameDatabase();