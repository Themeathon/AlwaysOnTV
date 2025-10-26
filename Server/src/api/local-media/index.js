import AbstractRouter from '~/api/AbstractRouter.js';
import StreamLocalVideo from '~/api/local-media/StreamLocalVideo.js';
// import checkPassword from '~/api/PasswordMiddleware.js';

class StreamRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/local-media' });
	}

	setupRouter (router) {
		super.setupRouter(router);
		// router.use(checkPassword);

		router.get('/local/:id', ...StreamLocalVideo);
	}
}

export default Router => new StreamRouter().getRouter(Router);