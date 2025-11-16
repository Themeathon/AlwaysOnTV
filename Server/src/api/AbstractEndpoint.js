import Joi from 'joi';

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
			mws.unshift(this.getValidateMiddleware(schema));
		}

		return mws;
	}

	getValidateMiddleware (schema) {
		return async (ctx, next) => {
			const validateOptions = {
				abortEarly: false,
				allowUnknown: true,
			};

			const validations = [];
			const keysToValidate = ['body', 'query', 'params'];

			for (const key of keysToValidate) {
				try {
					const subSchema = schema.extract(key);

					let targetData = {};
					if (key === 'body') targetData = ctx.request.body;
					else if (key === 'query') targetData = ctx.request.query;
					else if (key === 'params') targetData = ctx.params;

					validations.push(
						subSchema.validateAsync(targetData, validateOptions)
							.catch(error => Promise.reject({ target: key, error })),
					);
				} catch (e) {
					if (!e.message.includes('Schema does not contain path')) {
						throw e;
					}
				}
			}

			try {
				if (validations.length > 0) {
					await Promise.all(validations);
				}
			} catch (validationError) {
				const errorDetails = validationError.error.details.map(d => d.message).join(', ');
				const errorMessage = `Validation Error in ${validationError.target}: ${errorDetails}`;
				return super.error(ctx, errorMessage, 400);
			}

			return next();
		};
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