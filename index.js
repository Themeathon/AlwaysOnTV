import { initializeDatabase } from '~/db/index.js';
import setupKoa from '~/Koa.js';
import Config from '~/utils/Config.js';

async function start () {
	// Initialize config
	Config.load();

	await initializeDatabase();

	await setupKoa();

	// Initialize queue and history
	await import('~/queue/VideoQueue.js');
	await import('~/queue/HistoryQueue.js');
}

start();