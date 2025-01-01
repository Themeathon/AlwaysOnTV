import pino from '~/utils/Pino.js';

export default class AbstractDatabase {
	constructor (table_name) {
		this.table_name = table_name;
	}

	async init (knex) {
		this.knex = knex;
		await this.createTable();
	}

	async doesTableExist () {
		return this.knex.schema.hasTable(this.table_name);
	}

	async createTable () { }

	getKnex () {
		return this.knex(this.table_name);
	}

	async tryGet (where) {
		return (await this.select(where))[0];
	}

	async insert (data) {
		try {
			let result = false;

			await this.knex.transaction(async trx => {
				result = await trx(this.table_name).insert(data);
			});

			return result[0];
		}
		catch (error) {
			pino.error('Error in AbstractDatabase.insert');
			pino.error(error);
			throw error;
		}
	}

	async update (where, data) {
		try {
			await this.knex.transaction(async trx => {
				await trx(this.table_name).where(where).update(data);
			});

			return true;
		}
		catch (error) {
			pino.error('Error in AbstractDatabase.update');
			pino.error(error);
			throw error;
		}
	}

	async delete (where) {
		try {
			await this.knex.transaction(async trx => {
				await trx(this.table_name).where(where).del();
			});

			return true;
		}
		catch (error) {
			pino.error('Error in AbstractDatabase.delete');
			pino.error(error);
			throw error;
		}
	}

	async selectAll (criteria = '*') {
		return this.getKnex().select(criteria);
	}

	async select (where, criteria = '*') {
		return this.getKnex().select(criteria).where(where);
	}

	async selectIn (columns, builder, criteria = '*') {
		return this.getKnex().select(criteria).whereIn(columns, builder);
	}

	/* Helper Methods */

	async getByID (id) {
		return this.tryGet({ id });
	}

	async exists (where) {
		return (await this.select(where)).length;
	}
}