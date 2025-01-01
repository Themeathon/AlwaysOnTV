import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import Router from '@koa/router';
import pino from '~/utils/Pino.js';

export default async function setupRouters (app) {
	const files = await readdir('src/api');

	for (const file of files) {
		const pth = path.join('src/api', file);

		if (!(await stat(pth)).isDirectory()) continue;

		const { default: initRouter } = await import(`~/api/${file}/index.js`);
		const { routes, allowedMethods } = await initRouter(Router);
		app.use(routes);
		app.use(allowedMethods);

		pino.info(`Loaded ${file} router`);
	}
}
