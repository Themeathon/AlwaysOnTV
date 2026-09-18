import Joi from 'joi';
import AbstractEndpoint from '../AbstractEndpoint.js';
import Config from '#utils/Config.js';
import pino from '#utils/Pino.js';
import YTDL from '#utils/ytdl/index.js';

class GetMPDFromYouTube extends AbstractEndpoint {
	setup () {
		this.add(this.getMPDFromYouTube);
	}

	getSchema () {
		return Joi.object({
			query: Joi.object({
				videoId: Joi.string().required(),
				videoQuality: Joi.number(),
			}),
		});
	}

	async getMPDFromYouTube (ctx, next) {
		try {
			const { videoId } = ctx.request.query;
			const videoQuality = Number(ctx.request.query.videoQuality) || Config.maxVideoQuality;

			ctx.type = 'application/dash+xml';
			ctx.body = await YTDL.getDashMPD(videoId, videoQuality);

			return next();
		}
		catch (error) {
			pino.error({ err: error }, 'Error in GetMPDFromYouTube.getMPDFromYouTube');
			return super.error(ctx, error, 500);
		}
	}
}

export default new GetMPDFromYouTube().middlewares();
