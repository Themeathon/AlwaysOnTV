import { pipeline } from 'node:stream';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import YTDL from '~/utils/ytdl/index.js';
import Config from '~/utils/Config.js';
import got from 'got'; 
import pino from '~/utils/Pino.js';

class GetProxiedStreamType extends AbstractEndpoint {
	setup () {
		this.add(this.proxyStream);
	}

	async proxyStream (ctx, next) {
		try {
			const { videoId } = ctx.params;
			
			const videoQuality = Config.maxVideoQuality || 1080;

			pino.info(`[GetProxiedStreamType] Launching stream proxy tracking for ID: ${videoId} at configured limit: ${videoQuality}p`);

			const streamData = await YTDL.getBestVideoAndAudio(videoId, videoQuality);
			
			if (!streamData || !streamData.video || !streamData.video.url) {
				return super.error(ctx, 'Stream URL not resolvable', 404);
			}

			const targetUrl = streamData.video.url;

			ctx.status = ctx.headers.range ? 206 : 200;
			ctx.set('Content-Type', 'video/mp4');
			ctx.set('Accept-Ranges', 'bytes');

			const headers = {};
			if (ctx.headers.range) {
				headers.range = ctx.headers.range;
			}

			const remoteStream = got.stream(targetUrl, { 
				headers,
				decompress: false 
			});

			pipeline(remoteStream, ctx.res, (err) => {
				if (err) {
					if (err.code === 'ERR_STREAM_PREMATURE_CLOSE' || err.name === 'RequestError') {
						return; 
					}
					pino.error(`[GetProxiedStreamType] Proxy stream pipeline connection exception: ${err.message}`);
				}
			});

			ctx.respond = false;
			return next();

		} catch (error) {
			pino.error(`[GetProxiedStreamType] Critical setup error for stream proxy: ${error.message}`);
			if (ctx.respond !== false) {
				return super.error(ctx, 'Error establishing proxy connection pipeline', 500);
			}
		}
	}
}

export default new GetProxiedStreamType().middlewares();