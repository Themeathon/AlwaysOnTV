import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';

import AuthCallback from '~/api/auth/AuthCallback.js';
import TestAuth from '~/api/auth/TestAuth.js';

class GameRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/auth' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.post('/', ...TestAuth);
		router.get('/callback', checkPassword, ...AuthCallback);
	}
}

export default Router => new GameRouter().getRouter(Router);