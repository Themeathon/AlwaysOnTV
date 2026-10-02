import AbstractEndpoint from '../AbstractEndpoint.js';
import { consumeState, getRedirectURI } from './ConnectTwitch.js';

import Twitch from '#utils/Twitch.js';
import pino from '#utils/Pino.js';

class AuthCallback extends AbstractEndpoint {
	setup () {
		this.add(this.authCallback);
	}

	async authCallback (ctx, next) {
		const { code, state, error, error_description } = ctx.query;

		let data;

		if (error) {
			data = {
				status: 400,
				message: error_description || error,
			};
		}
		else if (!code || !state || !consumeState(state)) {
			data = {
				status: 400,
				message: 'The Twitch login expired or is invalid, please try again',
			};
		}
		else {
			try {
				await Twitch.connectWithCode(code, getRedirectURI(ctx));

				data = {
					status: 200,
					message: 'Successfully authenticated and updated Twitch information',
				};
			}
			catch (err) {
				pino.error('Error in AuthCallback.authCallback');
				pino.error(err);

				data = {
					status: err.response?.statusCode || 500,
					message: 'There was an error trying to authenticate with Twitch',
				};
			}
		}

		ctx.set('Content-Security-Policy', 'default-src *; style-src \'self\' http://* \'unsafe-inline\'; script-src \'self\' http://* \'unsafe-inline\' \'unsafe-eval\'');
		ctx.type = 'text/html';

		ctx.body = `
		<html>
			<head>
				<script>
					window.opener.postMessage(${JSON.stringify(data).replace(/</g, '\\u003c')}, '*');
				</script>
			</head>
			<body></body>
		</html>
		`;

		return next();
	}
}

export default new AuthCallback().middlewares();
