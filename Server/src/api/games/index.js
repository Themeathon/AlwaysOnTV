import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';
import AddGame from '~/api/games/AddGame.js';
import DeleteGameByID from '~/api/games/DeleteGameByID.js';
import GetAllGames from '~/api/games/GetAllGames.js';
import GetGameByID from '~/api/games/GetGameByID.js';
import GetGamesByName from '~/api/games/GetGamesByName.js';
import UpdateGameByID from '~/api/games/UpdateGameByID.js';
import UpdateGameOrder from '~/api/games/UpdateGameOrder.js';

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