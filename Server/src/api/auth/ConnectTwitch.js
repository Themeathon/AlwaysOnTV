import { randomBytes } from 'node:crypto';
import { URL } from 'node:url';

import AbstractEndpoint from '../AbstractEndpoint.js';
import { TwitchConfig } from '#utils/Config.js';
import Twitch, { TWITCH_CREDENTIALS_MISSING } from '#utils/Twitch.js';

const SCOPES = ['user_read', 'channel:manage:broadcast'];
const STATE_TTL = 10 * 60 * 1000;

const pendingStates = new Map();

export function getRedirectURI (ctx) {
	return `${ctx.protocol}://${ctx.host}/auth/connect/twitch/callback`;
}

export function consumeState (state) {
	const expiresAt = pendingStates.get(state);
	pendingStates.delete(state);

	return expiresAt !== undefined && expiresAt > Date.now();
}

class ConnectTwitch extends AbstractEndpoint {
	setup () {
		this.add(this.connectTwitch);
	}

	async connectTwitch (ctx) {
		if (!Twitch.hasAppCredentials())
			return super.error(ctx, TWITCH_CREDENTIALS_MISSING, 412);

		const now = Date.now();
		for (const [state, expiresAt] of pendingStates) {
			if (expiresAt <= now) pendingStates.delete(state);
		}

		const state = randomBytes(16).toString('hex');
		pendingStates.set(state, now + STATE_TTL);

		const url = new URL('https://id.twitch.tv/oauth2/authorize');
		url.searchParams.set('response_type', 'code');
		url.searchParams.set('client_id', TwitchConfig.clientID);
		url.searchParams.set('redirect_uri', getRedirectURI(ctx));
		url.searchParams.set('scope', SCOPES.join(' '));
		url.searchParams.set('state', state);

		ctx.redirect(url.href);
	}
}

export default new ConnectTwitch().middlewares();
