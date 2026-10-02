import { readFileSync } from 'node:fs';
import { setInterval } from 'node:timers';
import { URL } from 'node:url';

import got from 'got';
import Config from '#utils/Config.js';
import pino from '#utils/Pino.js';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/Themeathon/AlwaysOnTV/releases/latest';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

// Tolerates old tag styles like "v.2.0" and "v2.0" next to "v2.1.0"
function parseVersion (version) {
	const parts = String(version).replace(/^v\.?/i, '').split('-')[0].split('.');

	return [0, 1, 2].map(i => Number.parseInt(parts[i], 10) || 0);
}

export function isNewerVersion (candidate, current) {
	const a = parseVersion(candidate);
	const b = parseVersion(current);

	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] > b[i];
	}

	return false;
}

export default class UpdateChecker {
	static currentVersion = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url))).version;

	// { version, url } of the latest GitHub release, null until the first successful check
	static latestRelease = null;

	static start () {
		this.check();

		setInterval(() => this.check(), CHECK_INTERVAL).unref();
	}

	static async check () {
		if (!Config.updateCheckEnabled) return;

		try {
			const release = await got(LATEST_RELEASE_URL, {
				headers: {
					'accept': 'application/vnd.github+json',
					'user-agent': `AlwaysOnTV/${this.currentVersion}`,
				},
				timeout: { request: 10_000 },
				retry: { limit: 0 },
			}).json();

			this.latestRelease = {
				version: release.tag_name,
				url: release.html_url,
			};

			if (this.updateAvailable) {
				pino.info(`A new AlwaysOnTV version is available: ${release.tag_name} (installed: v${this.currentVersion}). ${release.html_url}`);
			}
		}
		catch (error) {
			pino.warn(`Update check failed: ${error.message}`);
		}
	}

	static get updateAvailable () {
		return Boolean(
			Config.updateCheckEnabled &&
			this.latestRelease &&
			isNewerVersion(this.latestRelease.version, this.currentVersion) &&
			this.latestRelease.version !== Config.dismissedUpdateVersion,
		);
	}
}
