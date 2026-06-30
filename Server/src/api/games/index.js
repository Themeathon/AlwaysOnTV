import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';
import AddGame from './AddGame.js';
import DeleteGameByID from './DeleteGameByID.js';
import GetAllGames from './GetAllGames.js';
import GetGameByID from './GetGameByID.js';
import GetGamesByName from './GetGamesByName.js';
import UpdateGameByID from './UpdateGameByID.js';
import UpdateGameOrder from './UpdateGameOrder.js';

class GameRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/games' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetAllGames);
		router.get('/:orderBy', ...GetAllGames);
		router.put('/', ...AddGame);

		router.post('/name', ...GetGamesByName);
		router.post('/order', ...UpdateGameOrder);

		router.get('/id/:id', ...GetGameByID);
		router.post('/id/:id', ...UpdateGameByID);
		router.post('/id/:id/delete', ...DeleteGameByID);
	}
}

export default Router => new GameRouter().getRouter(Router);