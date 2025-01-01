import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import PlaylistDatabase from '~/db/PlaylistDatabase.js';

class GetAllPlaylists extends AbstractEndpoint {
	setup () {
		this.add(this.getAllPlaylists);
	}

	async getAllPlaylists (ctx, next) {
		try {
			return super.success(ctx, next, await PlaylistDatabase.getAllPlaylists());
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetAllPlaylists().middlewares();