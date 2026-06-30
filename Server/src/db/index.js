import fs from 'node:fs';
import Knex from 'knex';
import pino from '~/utils/Pino.js';

let knex;

export async function initializeDatabase () {
	knex = Knex({
		client: 'better-sqlite3',
		connection: {
			filename: './data.db',
		},
		useNullAsDefault: true,
	});
	await knex.raw('PRAGMA foreign_keys = ON');

	const files = await fs.promises.readdir('src/db');

	for (const file of files) {
		if (!file.endsWith('.js')) continue;
		if (file === 'index.js') continue;
		if (file === 'AbstractDatabase.js') continue;

		const { default: Database } = await import(`./${file}`);
		await Database.init(knex);
	}

	pino.info('Initialized databases');
}
