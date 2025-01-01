import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class ClearQueue extends AbstractEndpoint {
	setup () {
		this.add(this.clearQueue);
	}

	async clearQueue (ctx, next) {
		try {
			await VideoQueue.clear();

			return super.success(ctx, next);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new ClearQueue().middlewares();