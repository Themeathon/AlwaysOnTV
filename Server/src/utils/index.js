import got from 'got';
import { ServerConfig } from '~/utils/Config.js';
import pino from '~/utils/Pino.js';

export default class Utils {
	static proxy (url) {
		return `${ServerConfig.api_url}/proxy/${url}`;
	}

	static async sleep (ms) {
		return new Promise(r => setTimeout(r, ms));
	}

	static async request (_url, options = {}) {
		try {
			const url = new URL(_url);

			return await got(url, options).json();
		}
		catch (error) {
			pino.error('Error in Utils.request');
			pino.error(error);
			throw error;
		}
	}

	static async requestJSON (_url, options = {}) {
		try {
			options.headers = options.headers || {};
			options.headers['content-type'] = 'application/json';

			return this.request(_url, options);
		}
		catch (error) {
			pino.error('Error in Utils.requestJSON');
			pino.error(error);
			throw error;
		}
	}

	static async getAsJSON (url, options = {}) {
		return this.requestJSON(url, {
			...options,
			method: 'GET',
		});
	}

	static async postAsJSON (url, options = {}) {
		return this.requestJSON(url, {
			...options,
			method: 'POST',
		});
	}

	static async patchAsJSON (url, options = {}) {
		return this.requestJSON(url, {
			...options,
			method: 'PATCH',
		});
	}
}