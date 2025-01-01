import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import HistoryQueue from '~/queue/HistoryQueue.js';

class GetHistory extends AbstractEndpoint {
	setup () {
		this.add(this.getHistory);
	}

	async getHistory (ctx, next) {
		try {
			return super.success(ctx, next, HistoryQueue.getData());
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetHistory().middlewares();