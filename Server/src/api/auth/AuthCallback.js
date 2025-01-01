import AbstractEndpoint from '~/api/AbstractEndpoint.js';

import Twitch from '~/utils/Twitch.js';

class AuthCallback extends AbstractEndpoint {
	setup () {
		this.add(this.authCallback);
	}

	async authCallback (ctx, next) {
		if (!ctx.session.grant) {
			return super.error(ctx, 'No session data present');
		}

		if (ctx.session.grant.provider !== 'twitch') {
			return super.error(ctx, 'Not authenticated with Twitch');
		}

		let data = {};

		try {
			const { access_token, refresh_token, expires_in } = ctx.session.grant.response.raw;

			await Twitch.updateTwitchData(access_token, refresh_token, expires_in);

			data = {
				status: 200,
				message: 'Successfully authenticated and updated Twitch information',
			};
		} catch (statusCode) {
			data = {
				status: statusCode,
				message: 'There was an error trying to authenticate with Twitch',
			};
		}

		ctx.set('Content-Security-Policy', 'default-src *; style-src \'self\' http://* \'unsafe-inline\'; script-src \'self\' http://* \'unsafe-inline\' \'unsafe-eval\'');
		ctx.type = 'text/html';

		ctx.body = `
		<html>
			<head>
				<script>
					window.opener.postMessage({
						status: ${data.status},
						message: '${data.message}'
					}, '*');
				</script>
			</head>
			<body></body>
		</html>
		`;

		return next();
	}
}

export default new AuthCallback().middlewares();