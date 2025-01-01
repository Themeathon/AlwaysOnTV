import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';

class TestAuth extends AbstractEndpoint {
	setup () {
		this.add(this.testAuth);
	}

	async testAuth (ctx, next) {
		const { authorization } = ctx.headers;

		if (!authorization) {
			return super.error(ctx, 'Incorrect password', 401);
		}

		if (Config.password && authorization !== Config.password) {
			return super.error(ctx, 'Incorrect password', 401);
		}

		return super.success(ctx, next, {
			authenticated: true,
		});
	}
}

export default new TestAuth().middlewares();