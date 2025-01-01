import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
import pino from '~/utils/Pino.js';
import YTDL from '~/utils/ytdl/index.js';

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

			const data = await YTDL.getDashMPD(videoId, videoQuality);
			if (data.error) {
				return super.error(ctx, data.error);
			}

			ctx.body = data;
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