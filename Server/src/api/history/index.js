import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import GetHistory from './GetHistory.js';

class HistoryRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/history' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetHistory);
	}
}

export default Router => new HistoryRouter().getRouter(Router);