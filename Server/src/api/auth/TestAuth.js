import AbstractEndpoint from '../AbstractEndpoint.js';
import Config from '#utils/Config.js';

class TestAuth extends AbstractEndpoint {
	setup () {
		this.add(this.testAuth);
	}

	async testAuth (ctx, next) {
		if (!Config.isAuthorized(ctx.headers.authorization)) {
			return super.error(ctx, 'Incorrect password', 401);
		}

		return super.success(ctx, next, {
			authenticated: true,
			password_enabled: Config.passwordEnabled,
		});
	}
}

export default new TestAuth().middlewares();