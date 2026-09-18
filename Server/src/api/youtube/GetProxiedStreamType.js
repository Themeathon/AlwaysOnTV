import { pipeline } from 'node:stream';
import got from 'got';
import AbstractEndpoint from '../AbstractEndpoint.js';
import YTDL from '#utils/ytdl/index.js';
import pino from '#utils/Pino.js';

const FORWARDED_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

class GetProxiedStreamType extends AbstractEndpoint {
	setup () {
		this.add(this.proxyStream);
	}

	async openUpstream (videoId, formatId, range, force) {
		const format = await YTDL.getStreamFormat(videoId, formatId, force);
		if (!format) return null;

		const headers = { ...format.http_headers };
		if (range) headers.range = range;

		const stream = got.stream(format.url, {
			headers,
			decompress: false,
			throwHttpErrors: false,
		});

		const response = await new Promise((resolve, reject) => {
			stream.once('response', resolve);
			stream.once('error', reject);
		});

		return { stream, response };
	}

	async proxyStream (ctx) {
		const { videoId, formatId } = ctx.params;
		const { range } = ctx.headers;

		try {
			let upstream = await this.openUpstream(videoId, formatId, range, false);

			if (upstream && [403, 410].includes(upstream.response.statusCode)) {
				upstream.stream.destroy();
				upstream = await this.openUpstream(videoId, formatId, range, true);
			}

			if (!upstream) {
				return super.error(ctx, `Format ${formatId} not available for ${videoId}`, 404);
			}

			const { stream, response } = upstream;

			if (response.statusCode >= 400) {
				stream.destroy();
				pino.warn(`[GetProxiedStreamType] Upstream returned ${response.statusCode} for ${videoId}/${formatId}`);
				return super.error(ctx, `Upstream returned ${response.statusCode}`, 502);
			}

			ctx.status = response.statusCode;
			for (const header of FORWARDED_HEADERS) {
				if (response.headers[header]) ctx.set(header, response.headers[header]);
			}

			ctx.respond = false;
			ctx.res.flushHeaders();

			pipeline(stream, ctx.res, error => {
				if (error && error.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
					pino.error(`[GetProxiedStreamType] Pipeline error for ${videoId}/${formatId}: ${error.message}`);
				}
			});
		}
		catch (error) {
			pino.error({ err: error }, `[GetProxiedStreamType] Failed to proxy ${videoId}/${formatId}`);
			if (ctx.respond !== false) {
				return super.error(ctx, 'Error proxying stream', 502);
			}
		}
	}
}

export default new GetProxiedStreamType().middlewares();
