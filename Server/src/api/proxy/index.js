import AbstractRouter from '~/api/AbstractRouter.js';
import ProxyRequest from '~/api/proxy/ProxyRequest.js';

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