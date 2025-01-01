import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';

class GetAllVideos extends AbstractEndpoint {
	setup () {
		this.add(this.getAllVideos);
	}

	async getAllVideos (ctx, next) {
		try {
			return super.success(ctx, next, await RandomPlaylistDatabase.getAll());
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetAllVideos().middlewares();