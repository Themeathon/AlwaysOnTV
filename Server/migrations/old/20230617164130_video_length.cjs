/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
	return knex.schema.table('videos', function (table) {
		table.integer('length').notNullable().defaultTo(0).comment('Video Length In Seconds');
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
	return knex.raw('alter table "videos" drop column "length"');
};
