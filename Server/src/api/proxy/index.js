import AbstractRouter from '../AbstractRouter.js';
import ProxyRequest from './ProxyRequest.js';

class ProxyRouter extends AbstractRouter {
	constructor() {
		super({ prefix: '/api/proxy', exclusive: false });
	}

	setupRouter(router) {
		super.setupRouter(router);

		router.all('/*path', ...ProxyRequest);
	}
}

export default Router => new ProxyRouter().getRouter(Router);