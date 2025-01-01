import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class GetQueue extends AbstractEndpoint {
	setup () {
		this.add(this.getQueue);
	}

	async getQueue (ctx, next) {
		try {
			return super.success(ctx, next, VideoQueue.getData());
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetQueue().middlewares();