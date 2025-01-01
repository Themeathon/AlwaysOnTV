import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import Config from '~/utils/Config.js';

class GetSettings extends AbstractEndpoint {
	setup () {
		this.add(this.getSettings);
	}

	async getSettings (ctx, next) {
		return super.success(ctx, next, Config.data);
	}
}

export default new GetSettings().middlewares();