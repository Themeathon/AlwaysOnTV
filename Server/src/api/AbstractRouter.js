export default class AbstractRouter {
	constructor (options = null) {
		this.options = options;
	}

	getRouter (Router) {
		this.setupRouter(Router(this.options));

		return {
			routes: this.router.routes(),
			allowedMethods: this.router.allowedMethods(),
		};
	}

	setupRouter (router) {
		this.router = router;
	}
}