import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import AuthCallback from './AuthCallback.js';
import TestAuth from './TestAuth.js';

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