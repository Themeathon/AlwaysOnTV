import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';
import SearchGamesOnIGDB from './SearchGamesOnIGDB.js';
import UpdateTwitchInfo from './UpdateTwitchInfo.js';

class TwitchRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/twitch' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.post('/search-games', ...SearchGamesOnIGDB);
		router.post('/update', ...UpdateTwitchInfo);
	}
}

export default Router => new TwitchRouter().getRouter(Router);