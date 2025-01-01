import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';

import GetSettings from '~/api/settings/GetSettings.js';
import UpdateSettings from '~/api/settings/UpdateSettings.js';

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