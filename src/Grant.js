import Grant from 'grant-koa';
import { ServerConfig } from '~/utils/Config.js';

// Lordmau5: What should I call the class that holds the Grant related stuff?
// Jugachi: Gran Turismo.
// Lordmau5: Alright.
class GrantUrismo {
	constructor () {
		this.grant = Grant({
			defaults: {
				protocol: 'http',
				host: `localhost:${ServerConfig.port}`,
				path: '/auth',
				callback: '/auth/callback',
				transport: 'session',
				state: true,
			},
			twitch: {
				key: '', // client-id
				secret: '', // client-secret
				scope: ['user_read', 'channel:manage:broadcast'], // Add any additional scopes you need
			},
		});
	}

	get middleware () {
		return this.grant;
	}

	set twitchClientID (client_id) {
		this.grant.config.twitch.key = client_id;
	}

	set twitchClientSecret (client_secret) {
		this.grant.config.twitch.secret = client_secret;
	}
}

export default new GrantUrismo();