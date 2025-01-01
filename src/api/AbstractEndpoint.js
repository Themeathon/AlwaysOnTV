import { getValidateAllMw } from 'koa-mw-joi';

export default class AbstractEndpoint {
	constructor () {
		this._middlewares = [];

		this.setup();
	}

	add (fn) {
		this._middlewares.push(fn.bind(this));
	}

	setup () {}

	getSchema () {}

	middlewares () {
		const mws = [...this._middlewares];

		const schema = this.getSchema();
		if (schema) {
			mws.unshift(getValidateAllMw(schema));
		}

		return mws;
	}

	async success (ctx, next, data = null) {
		ctx.status = 200;

		ctx.body = {
			status: 'success',
			data,
		};

		return next && next();
	}

	async fail (ctx, next, data = null) {
		ctx.status = 200;

		ctx.body = {
			status: 'success',
			data,
		};

		return next && next();
	}

	async error (ctx, messageOrError, statusCode = 400) {
		ctx.status = statusCode;

		ctx.body = {
			status: 'error',
			message: messageOrError?.message || messageOrError,
		};
	}
}