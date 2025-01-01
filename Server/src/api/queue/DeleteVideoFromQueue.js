import VideoQueue from '~/queue/VideoQueue.js';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';

class DeleteVideoFromQueue extends AbstractEndpoint {
	setup () {
		this.add(this.checkIndex);
		this.add(this.deleteVideoFromQueue);
	}

	async checkIndex (ctx, next) {
		const { index } = ctx.params;

		const parsedIndex = parseInt(index, 10);

		if (!Number.isFinite(parsedIndex)) {
			return super.error(ctx, `Invalid value for index: ${index}`);
		}

		ctx.index = parsedIndex;

		return next();
	}

	async deleteVideoFromQueue (ctx, next) {
		try {
			const index = ctx.index;

			const result = await VideoQueue.remove(index);

			return super.success(ctx, next, result);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new DeleteVideoFromQueue().middlewares();