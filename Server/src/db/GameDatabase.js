import AbstractDatabase from './AbstractDatabase.js';
import pino from '~/utils/Pino.js';

class GameDatabase extends AbstractDatabase {
	constructor () {
		super('games');
	}

	async createTable () {
		super.createTable();

		if (!(await this.doesTableExist())) {
			await this.knex.schema.createTable(this.table_name, table => {
				table.string('id').primary().notNullable().defaultTo(null).comment('Twitch Game ID');
				table.timestamp('created_at').notNullable().defaultTo(this.knex.fn.now()).comment('Game Creation Date');
				table.string('title').notNullable().defaultTo(null).comment('Twitch Game Title');
				table.string('thumbnail_url').notNullable().defaultTo(null).comment('Game Thumbnail URL');
				table.integer('index').notNullable().defaultTo(0).comment('Custom Sort Order');
			});

			// Add a default game
			await this.createGame('499973', 'Always On', 'https://static-cdn.jtvnw.net/ttv-boxart/499973-500x700.jpg');
			await this.createGame('27284', 'Retro', 'https://static-cdn.jtvnw.net/ttv-boxart/27284-144x192.jpg');
		}

		// MIGRATION if index table misses
		const hasIndex = await this.knex.schema.hasColumn(this.table_name, 'index');
		if (!hasIndex) {
			pino.info('Migrating games table: adding index column...');
			await this.knex.schema.table(this.table_name, table => {
				table.integer('index').notNullable().defaultTo(0);
			});

			const games = await this.getKnex().select('id').orderBy('title');
			let i = 1;
			for(const game of games) {
				await this.update({ id: game.id }, { index: i++ });
			}
			pino.info('Migration complete.');
		}
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
				'games.index as index',
			)
			.leftJoin('videos', 'games.id', 'videos.gameId')
			.groupBy('games.id')
			.count('videos.id as videoCount')
			.orderBy('games.index', 'asc');
	}

	async getGamesByName (title) {
		return this.getKnex()
			.select(
				'games.id as id',
				'games.title as title',
				'games.thumbnail_url as thumbnail_url',
				'games.index as index',
			)
			.whereRaw('LOWER(games.title) LIKE LOWER(?)', `%${title}%`)
			.leftJoin('videos', 'games.id', 'videos.gameId')
			.groupBy('games.id')
			.count('videos.id as videoCount')
			.orderBy('games.index', 'asc');
	}

	async getLatestIndex () {
		const result = await this.getKnex()
			.max('index as maxIndex')
			.first();
		return result?.maxIndex || 0;
	}

	async createGame (id, title, thumbnail_url) {
		if (!id || !title || !thumbnail_url) return false;

		if (await super.getByID(id)) {
			return false;
		}

		const nextIndex = (await this.getLatestIndex()) + 1;

		await this.insert({
			id,
			title,
			thumbnail_url,
			index: nextIndex,
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

		const result = await this.delete({ id });

		await this.fixIndices();

		return result;
	}

	async fixIndices() {
		const games = await this.getKnex().select('id').orderBy('index', 'asc');
		let i = 1;
		for (const game of games) {
			await this.update({ id: game.id }, { index: i++ });
		}
	}

	async moveGame (gameId, newIndex) {
		const game = await this.getByID(gameId);
		if (!game) return false;

		const oldIndex = game.index;
		if (oldIndex === newIndex) return true;

		try {
			await this.knex.transaction(async trx => {
				await trx(this.table_name)
					.where({ id: gameId })
					.update({ index: -1 });

				if (newIndex < oldIndex) {
					await trx(this.table_name)
						.whereBetween('index', [newIndex, oldIndex - 1])
						.increment('index', 1);
				} else {
					await trx(this.table_name)
						.whereBetween('index', [oldIndex + 1, newIndex])
						.decrement('index', 1);
				}

				await trx(this.table_name)
					.where({ id: gameId })
					.update({ index: newIndex });
			});

			await this.fixIndices();
			return true;
		} catch (error) {
			pino.error('Error in GameDatabase.moveGame');
			pino.error(error);
			return false;
		}
	}
}

export default new GameDatabase();