import pino from '~/utils/Pino.js';

import chokidar from 'chokidar';

import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';

export default class Config {
	static {
		this.savedManually = false;
		this.path = './config.json';

		const adapter = new JSONFileSync(this.path);

		this.db = new LowSync(adapter, this.getDefaultData());
		this.load();

		chokidar.watch(this.path).on('change', () => {
			if (this.savedManually) {
				this.savedManually = false;
				return;
			}

			pino.info('Config changed, reloading...');

			this.load();
		});
	}

	static getDefaultData () {
		return {
			password: 'AlwaysOnTV',
			server: {
				port: 8085,
				api_url: 'http://localhost:8085/api',
			},
			twitch: {
				enabled: false,
				title_replacement: '[24/7 AlwaysOnTV] {{videoTitle}}',

				client_id: '',
				client_secret: '',
				access_token: '',
				refresh_token: '',
				expires_at: 0,
				channel_id: '',

				app_access_token: '',
				app_expires_at: 0,
			},
			max_video_quality: 1080,
			use_random_playlist: true,
		};
	}

	static async load () {
		const data = this.db.read();

		const { default: GrantUrismo } = await import('~/Grant.js');

		GrantUrismo.twitchClientID = TwitchConfig.clientID;
		GrantUrismo.twitchClientSecret = TwitchConfig.clientSecret;

		return data;
	}

	static save () {
		this.savedManually = true;
		return this.db.write();
	}

	static get data () {
		return this.db.data;
	}

	// password
	static get password () {
		return this.data.client_secret;
	}

	// maxVideoQuality
	static get maxVideoQuality () {
		return this.data.max_video_quality;
	}

	static set maxVideoQuality (max_video_quality) {
		if (max_video_quality === undefined) return;

		this.data.max_video_quality = max_video_quality;

		this.save();
	}

	// useRandomPlaylist
	static get useRandomPlaylist () {
		return this.data.use_random_playlist;
	}

	static set useRandomPlaylist (use_random_playlist) {
		if (use_random_playlist === undefined) return;

		this.data.use_random_playlist = use_random_playlist;

		this.save();
	}
}

export class ServerConfig {
	static get config () {
		return Config.data.server;
	}

	static get port () {
		return this.config.port;
	}

	static get api_url () {
		return this.config.api_url;
	}
}

export class TwitchConfig {
	static get config () {
		return Config.data.twitch;
	}

	static save () {
		Config.save();
	}

	// isEnabled
	static get isEnabled () {
		return this.config.enabled;
	}

	static set isEnabled (enabled) {
		if (enabled === undefined) return;

		this.config.enabled = enabled;

		this.save();
	}

	// titleReplacement
	static get titleReplacement () {
		return this.config.title_replacement;
	}

	static set titleReplacement (title_replacement) {
		if (title_replacement === undefined) return;

		this.config.title_replacement = title_replacement;

		this.save();
	}

	static async updateGrantConfig () {
		const { default: GrantUrismo } = await import('~/Grant.js');

		GrantUrismo.twitchClientID = this.clientID;
		GrantUrismo.twitchClientSecret = this.clientSecret;
	}

	// clientID
	static get clientID () {
		return this.config.client_id;
	}

	static set clientID (client_id) {
		if (client_id === undefined) return;

		this.config.client_id = client_id;

		this.save();

		this.updateGrantConfig();
	}

	// clientSecret
	static get clientSecret () {
		return this.config.client_secret;
	}

	static set clientSecret (client_secret) {
		if (client_secret === undefined) return;

		this.config.client_secret = client_secret;

		this.save();

		this.updateGrantConfig();
	}

	// accessToken
	static get accessToken () {
		return this.config.access_token;
	}

	static set accessToken (access_token) {
		if (access_token === undefined) return;

		this.config.access_token = access_token;

		this.save();
	}

	// refreshToken
	static get refreshToken () {
		return this.config.refresh_token;
	}

	static set refreshToken (refresh_token) {
		if (refresh_token === undefined) return;

		this.config.refresh_token = refresh_token;

		this.save();
	}

	// expiresAt
	static get expiresAt () {
		return this.config.expires_at;
	}

	static set expiresAt (expires_at) {
		if (expires_at === undefined) return;

		this.config.expires_at = expires_at;

		this.save();
	}

	// channelID
	static get channelID () {
		return this.config.channel_id;
	}

	static set channelID (channel_id) {
		if (channel_id === undefined) return;

		this.config.channel_id = channel_id;

		this.save();
	}

	// data - The data we get back from Twitch for the connected broadcaster
	static get data () {
		return this.config.data;
	}

	static set data (data) {
		if (data === undefined) return;

		this.config.data = data;

		this.save();
	}

	// appAccessToken
	static get appAccessToken () {
		return this.config.app_access_token;
	}

	static set appAccessToken (app_access_token) {
		if (app_access_token === undefined) return;

		this.config.app_access_token = app_access_token;

		this.save();
	}

	// appExpiresAt
	static get appExpiresAt () {
		return this.config.app_expires_at;
	}

	static set appExpiresAt (app_expires_at) {
		if (app_expires_at === undefined) return;

		this.config.app_expires_at = app_expires_at;

		this.save();
	}
}