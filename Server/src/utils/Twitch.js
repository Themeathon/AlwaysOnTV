import { DateTime } from 'luxon';
import { TwitchConfig } from '~/utils/Config.js';
import Utils from '~/utils/index.js';
import pino from '~/utils/Pino.js';

class Twitch {
	async getTwitchInfo (access_token) {
		try {
			const client_id = this.getClientID();

			access_token = access_token || await this.getAccessToken();

			const json = await Utils.getAsJSON('https://api.twitch.tv/helix/users', {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					'Client-ID': client_id,
				},
			});

			return json?.data[0];
		}
		catch (error) {
			pino.error('Error in Twitch.getTwitchInfo');
			pino.error(error);
			throw error;
		}
	}

	getBroadcasterID () {
		return TwitchConfig.data?.id;
	}

	getClientID () {
		return TwitchConfig.clientID;
	}

	async updateTwitchData (access_token, refresh_token, expires_in) {
		const expires_at = DateTime.now().plus({ seconds: expires_in });

		TwitchConfig.accessToken = access_token;
		TwitchConfig.refreshToken = refresh_token;
		TwitchConfig.expiresAt = expires_at.toISO();

		TwitchConfig.data = await this.getTwitchInfo(access_token);
	}

	async getAccessToken (force_renew = false) {
		if (
			!TwitchConfig.refreshToken ||
			!TwitchConfig.clientID ||
			!TwitchConfig.clientSecret
		)
			return null;

		if (
			DateTime.now() < DateTime.fromISO(TwitchConfig.expiresAt) &&
			TwitchConfig.accessToken &&
			!force_renew
		)
			return TwitchConfig.accessToken;

		pino.info('Renewing access token because it expired...');

		try {
			const url = new URL('https://id.twitch.tv/oauth2/token');
			url.searchParams.set('grant_type', 'refresh_token');
			url.searchParams.set('refresh_token', TwitchConfig.refreshToken);
			url.searchParams.set('client_id', TwitchConfig.clientID);
			url.searchParams.set('client_secret', TwitchConfig.clientSecret);

			const json = await Utils.postAsJSON(url, {
				headers: {
					'Client-ID': TwitchConfig.clientID,
				},
			});

			const {
				access_token,
				refresh_token,
				expires_in,
			} = json;

			if (!access_token || !refresh_token || !expires_in) return;

			this.updateTwitchData(access_token, refresh_token, expires_in);

			return access_token;
		}
		catch (error) {
			pino.error('Error in Twitch.getAccessToken');
			pino.error(error);
			throw error;
		}
	}

	async getAppAccessToken (force_renew = false) {
		if (
			DateTime.now() < DateTime.fromISO(TwitchConfig.appExpiresAt) &&
			TwitchConfig.appAccessToken &&
			!force_renew
		)
			return TwitchConfig.appAccessToken;

		pino.info('Renewing app access token because it expired...');

		try {
			const url = new URL('https://id.twitch.tv/oauth2/token');
			url.searchParams.set('grant_type', 'client_credentials');
			url.searchParams.set('client_id', TwitchConfig.clientID);
			url.searchParams.set('client_secret', TwitchConfig.clientSecret);

			const json = await Utils.postAsJSON(url, {
				headers: {
					'Client-ID': TwitchConfig.clientID,
				},
			});

			const {
				access_token,
				expires_in,
			} = json;

			if (!access_token || !expires_in) return;

			const expires_at = DateTime.now().plus({ seconds: expires_in });

			TwitchConfig.appAccessToken = access_token;
			TwitchConfig.appExpiresAt = expires_at.toISO();

			return access_token;
		}
		catch (error) {
			pino.error('Error in Twitch.getAppAccessToken');
			pino.error(error);
			throw error;
		}
	}

	async searchGamesOnIGDB (name, offset = 0) {
		try {
			const client_id = this.getClientID();
			const access_token = await this.getAppAccessToken();

			// external_games.uid is the ID on the specific service (GiantBomb, YouTube, Twitch, etc.)
			// external_games.category is the service (14 = Twitch)
			const body = `fields id, name, cover.url, external_games.uid, external_games.category; limit 500; offset ${offset}; search "${name}";`;

			const result = await Utils.postAsJSON('https://api.igdb.com/v4/games', {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					'Client-ID': client_id,
				},
				body,
			});

			return result.filter(game => game.external_games?.some(external => external.category === 14));
		}
		catch (error) {
			pino.error('Error in Twitch.searchGamesOnIGDB');
			pino.error(error);
			throw error;
		}
	}

	async getGameByIGDBID (igdb_id) {
		try {
			const client_id = this.getClientID();
			const access_token = await this.getAccessToken();

			const searchObject = {
				igdb_id,
			};

			const queryString = new URLSearchParams(searchObject);

			const json = await Utils.getAsJSON(`https://api.twitch.tv/helix/games?${queryString}`, {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					'Client-ID': client_id,
				},
			});

			return json.data?.[0];
		}
		catch (error) {
			pino.error('Error in Twitch.getGameByIGDBID');
			pino.error(error);
			throw error;
		}
	}

	async updateChannelInformation ({ title, game_id }) {
		if (!TwitchConfig.isEnabled) return true;

		try {
			const client_id = this.getClientID();
			const access_token = await this.getAccessToken();
			const broadcaster_id = this.getBroadcasterID();

			if (!client_id || !access_token || !broadcaster_id) {
				const error = new Error('No valid client_id, access token or broadcaster ID found.');

				pino.error('Error in Twitch.updateChannelInformation');
				pino.error(error);
				throw error;
			}

			const json = await Utils.patchAsJSON(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcaster_id}`, {
				headers: {
					'Authorization': `Bearer ${access_token}`,
					'Client-ID': client_id,
				},
				body: JSON.stringify({
					title: TwitchConfig.titleReplacement.replace('{{videoTitle}}', title),
					game_id,
				}),
			});

			return json;
		}
		catch (error) {
			pino.error('Error in Twitch.updateChannelInformation');
			pino.error(error);
			throw error;
		}
	}

	/**
   * Starts a commercial on the channel.
   * @param {number} duration - Length of the ad in seconds (30, 60, 90, 120, 150, or 180).
   * @returns {object} Response from the Twitch API.
   */
	async startCommercial(duration = 30) {
		try {
		  if (!TwitchConfig.isEnabled) {
			throw new Error('Twitch integration is not enabled.');
		  }
	
		  const client_id = this.getClientID();
		  const access_token = await this.getAccessToken();
		  const broadcaster_id = this.getBroadcasterID();
	
		  if (!client_id || !access_token || !broadcaster_id) {
			throw new Error('Missing client ID, access token, or broadcaster ID.');
		  }
	
		  const response = await Utils.postAsJSON('https://api.twitch.tv/helix/channels/commercial', {
			headers: {
			  'Authorization': `Bearer ${access_token}`,
			  'Client-ID': client_id,
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify({
			  broadcaster_id,
			  length: duration,
			}),
		  });
	
		  return response?.data?.[0]; // Return the first result from the API response.
		} catch (error) {
		  pino.error('Error in Twitch.startCommercial');
		  pino.error(error);
		  throw error;
		}
	  }
}

export default new Twitch();