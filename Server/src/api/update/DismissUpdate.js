import Joi from 'joi';

import AbstractEndpoint from '../AbstractEndpoint.js';

import Config from '#utils/Config.js';

class DismissUpdate extends AbstractEndpoint {
	setup () {
		this.add(this.dismissUpdate);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				version: Joi.string().required(),
			}),
		});
	}

	async dismissUpdate (ctx, next) {
		Config.dismissedUpdateVersion = ctx.request.body.version;

		return super.success(ctx, next, { dismissed_version: Config.dismissedUpdateVersion });
	}
}

export default new DismissUpdate().middlewares();
