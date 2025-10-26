import Koa from 'koa';
import responseTime from 'koa-response-time';
import { koaBody } from 'koa-body';
import conditional from 'koa-conditional-get';
import etag from 'koa-etag';
import json from 'koa-json';
import cors from '@koa/cors';
import serve from 'koa-static';

import session from 'koa-session';
import mount from 'koa-mount';
import GrantUrismo from '~/Grant.js';

import Socket from '~/Socket.js';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

async function setupKoa () {
	const app = new Koa();

	// Error handling
	app.use(async (ctx, next) => {
		try {
			await next();
		}
		catch (err) {
			ctx.app.emit('error', err, ctx);
		}
	});

	app.on('error', err => {
		if (err.code === 'ECONNRESET') {
			// This is fine, we shall allow it.
			return;
		}

		pino.error('Koa Error Handler');
		pino.error(err);
	});

	app.use(responseTime({ hrtime: true }));
	app.use(koaBody({
		multipart: true,
		jsonLimit: '3mb',
	}));
	app.use(conditional());
	app.use(etag());
	app.use(cors({
		origin: '*',
		maxAge: 1728000,
	}));
	app.use(json());

	app.use(mount(serve('./public')));
	app.use(async (ctx, next) => {
		const requestUrl = ctx.request.url;

		// Check if the request URL does not contain a period or does not end with a file extension
		if (
			requestUrl.includes('.') ||
			path.extname(requestUrl) ||
			requestUrl.startsWith('/api') ||
			requestUrl.startsWith('/auth')
		) {
			return next();
		}

		ctx.set('Content-Type', 'text/html');
		ctx.body = await readFile('./public/index.html', 'utf-8');
	});

	app.keys = ['grant_alwaysontv'];
	app.use(session(app));
	app.use(mount(GrantUrismo.middleware));

	app.proxy = true;

	return app;
}

import setupRouters from '~/api/index.js';
import pino from '~/utils/Pino.js';
import { ServerConfig } from '~/utils/Config.js';

export default async function start () {
	const app = await setupKoa();

	await setupRouters(app);

	const port = ServerConfig.port;

	const server = app.listen(port, () => {
		pino.info(`Koa server listening on localhost:${port}`);
	});

	Socket.setup(server);
}