import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const COOKIES_PATH = path.resolve(__dirname, '..', '..', '..', 'cookies.txt');

let cached = { mtime: 0, cookies: [] };

function loadCookies () {
	let stat;
	try {
		stat = fs.statSync(COOKIES_PATH);
	}
	catch {
		cached = { mtime: 0, cookies: [] };
		return cached.cookies;
	}

	if (stat.mtimeMs === cached.mtime) return cached.cookies;

	const cookies = fs.readFileSync(COOKIES_PATH, 'utf8')
		.split(/\r?\n/)
		.map(line => line.startsWith('#HttpOnly_') ? line.slice('#HttpOnly_'.length) : line)
		.filter(line => line && !line.startsWith('#'))
		.map(line => line.split('\t'))
		.filter(fields => fields.length >= 7)
		.map(([domain, , , secure, expires, name, value]) => ({
			domain: domain.replace(/^\./, ''),
			secure: secure === 'TRUE',
			expires: Number(expires),
			name,
			value,
		}));

	cached = { mtime: stat.mtimeMs, cookies };
	return cookies;
}

export function hasCookies () {
	return loadCookies().length > 0;
}

export function withCookies (headers, url) {
	const cookie = getCookieHeader(url);
	return cookie ? { ...headers, cookie } : headers;
}

export function getCookieHeader (url) {
	const { hostname, protocol } = new URL(url);
	const now = Date.now() / 1000;

	return loadCookies()
		.filter(cookie => hostname === cookie.domain || hostname.endsWith(`.${cookie.domain}`))
		.filter(cookie => !cookie.secure || protocol === 'https:')
		.filter(cookie => !cookie.expires || cookie.expires > now)
		.map(cookie => `${cookie.name}=${cookie.value}`)
		.join('; ');
}
