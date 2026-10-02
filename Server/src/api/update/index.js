import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import GetUpdate from './GetUpdate.js';
import DismissUpdate from './DismissUpdate.js';

class UpdateRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/update' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetUpdate);
		router.post('/dismiss', ...DismissUpdate);
	}
}

export default Router => new UpdateRouter().getRouter(Router);
