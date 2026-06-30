import { initializeDatabase } from './src/db/index.js';
import setupKoa from './src/Koa.js';
import Config from './src/utils/Config.js';

async function start () {
	// Initialize config
	Config.load();

	await initializeDatabase();

	await setupKoa();

	// Initialize queue and history
	await import('./src/queue/VideoQueue.js');
	await import('./src/queue/HistoryQueue.js');
}

start();