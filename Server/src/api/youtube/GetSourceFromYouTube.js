import Joi from 'joi';
import AbstractEndpoint from '../AbstractEndpoint.js';
import Config from '#utils/Config.js';
import pino from '#utils/Pino.js';
import DownloadManager from '#utils/ytdl/DownloadManager.js';

class GetSourceFromYouTube extends AbstractEndpoint {
	setup () {
		this.add(this.getSourceFromYouTube);
	}

	getSchema () {
		return Joi.object({
			query: Joi.object({
				videoId: Joi.string().required(),
				videoQuality: Joi.number(),
			}),
		});
	}

	async getSourceFromYouTube (ctx, next) {
		const { videoId } = ctx.request.query;
		const videoQuality = ctx.request.query.videoQuality || Config.maxVideoQuality;

		if (DownloadManager.isDownloaded(videoId) && !DownloadManager.activeDownloads.has(videoId)) {
			pino.info(`[GetSourceFromYouTube] ${videoId}: serving downloaded file`);
			return super.success(ctx, next, {
				type: 'file',
				path: `local-media/local/${videoId}`,
			});
		}

		pino.info(`[GetSourceFromYouTube] ${videoId}: serving DASH stream`);
		return super.success(ctx, next, {
			type: 'dash',
			path: `youtube/get-mpd?videoId=${encodeURIComponent(videoId)}&videoQuality=${videoQuality}`,
		});
	}
}

export default new GetSourceFromYouTube().middlewares();
