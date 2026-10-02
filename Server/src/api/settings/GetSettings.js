import AbstractEndpoint from '../AbstractEndpoint.js';

import Config from '#utils/Config.js';
import { hasCookies } from '#utils/ytdl/Cookies.js';

class GetSettings extends AbstractEndpoint {
	setup () {
		this.add(this.getSettings);
	}

	async getSettings (ctx, next) {
		return super.success(ctx, next, {
			...Config.data,
			youtube_cookies: hasCookies(),
		});
	}
}

export default new GetSettings().middlewares();