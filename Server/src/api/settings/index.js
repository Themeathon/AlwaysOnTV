import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import GetSettings from './GetSettings.js';
import UpdateSettings from './UpdateSettings.js';

class SettingsRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/settings' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetSettings);
		router.post('/', ...UpdateSettings);
	}
}

export default Router => new SettingsRouter().getRouter(Router);