import AbstractEndpoint from '../AbstractEndpoint.js';

import Config from '#utils/Config.js';
import { hasCookies } from '#utils/ytdl/Cookies.js';

class GetSettings extends AbstractEndpoint {
	setup () {
		this.add(this.getSettings);
	}

	async getSettings (ctx, next) {
		const { password, ...settings } = Config.data;

		return super.success(ctx, next, {
			...settings,
			password_enabled: Config.passwordEnabled,
			password_set: Boolean(password),
			youtube_cookies: hasCookies(),
		});
	}
}

export default new GetSettings().middlewares();