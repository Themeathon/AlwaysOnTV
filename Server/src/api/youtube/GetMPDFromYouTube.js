import Joi from 'joi';
import AbstractEndpoint from '../AbstractEndpoint.js';
import Config from '#utils/Config.js';
import pino from '#utils/Pino.js';
import DownloadManager from '#utils/ytdl/DownloadManager.js'; 

class GetMPDFromYouTube extends AbstractEndpoint {
	setup () {
		this.add(this.getVideoQuality);
		this.add(this.getMPDFromYouTube);
	}

	getSchema () {
		return Joi.object({
			query: Joi.object({
				videoId: Joi.string().required(),
				videoQuality: Joi.number().default(Config.maxVideoQuality),
			}),
		});
	}

	async getVideoQuality (ctx, next) {
		const { videoQuality } = ctx.request.query;
		ctx.videoQuality = videoQuality || Config.maxVideoQuality;
		return next();
	}

	async getMPDFromYouTube (ctx, next) {
		try {
			const { videoId } = ctx.request.query;
			const { videoQuality } = ctx;

			ctx.type = 'application/json';

			const isDownloaded = DownloadManager.isDownloaded(videoId);
			const isActivelyDownloading = DownloadManager.activeDownloads.has(videoId);
			const resolvedPath = DownloadManager.getFilePath(videoId);

			// pino.info(`[GetMPDFromYouTube] Diagnostics for ID ${videoId} -> isDownloaded: ${isDownloaded}, isActivelyDownloading: ${isActivelyDownloading}, resolvedPath: "${resolvedPath}"`);

			if (isDownloaded && !isActivelyDownloading) {
				pino.info(`[GetMPDFromYouTube] Routing decision: Serving cached local file stream.`);
				ctx.body = {
					status: 'cached',
					directUrl: `${Config.ServerConfig?.api_url || ''}/api/local-media/local/${videoId}` 
				};
				return next();
			}

			pino.info(`[GetMPDFromYouTube] Routing decision: Serving live stream proxy fallback.`);
			ctx.body = {
				status: 'live_fallback',
				directUrl: `${Config.ServerConfig?.api_url || ''}/api/youtube/${videoId}/video?videoQuality=${videoQuality}`
			};
			return next();
		}
		catch (error) {
			pino.error('Error in GetMPDFromYouTube.getMPDFromYouTube');
			pino.error(error);
			return super.error(ctx, error);
		}
	}
}

export default new GetMPDFromYouTube().middlewares();