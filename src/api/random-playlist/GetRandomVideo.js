import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';

class GetRandomVideo extends AbstractEndpoint {
	setup () {
		this.add(this.getRandomVideo);
	}

	async getRandomVideo (ctx, next) {
		try {
			const randomVideo = await RandomPlaylistDatabase.getRandomVideo();
			if (!randomVideo) {
				return super.error(ctx, 'The random playlist is empty.');
			}

			return super.success(ctx, next, {
				...randomVideo,
			});
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetRandomVideo().middlewares();