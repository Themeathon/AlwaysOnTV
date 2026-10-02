import AbstractEndpoint from '../AbstractEndpoint.js';

import UpdateChecker from '#utils/UpdateChecker.js';

class GetUpdate extends AbstractEndpoint {
	setup () {
		this.add(this.getUpdate);
	}

	async getUpdate (ctx, next) {
		return super.success(ctx, next, {
			current_version: UpdateChecker.currentVersion,
			update_available: UpdateChecker.updateAvailable,
			latest_version: UpdateChecker.latestRelease?.version ?? null,
			url: UpdateChecker.latestRelease?.url ?? null,
		});
	}
}

export default new GetUpdate().middlewares();
