import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import YTDL from '~/utils/ytdl/index.js';

class GetVideoFromYouTube extends AbstractEndpoint {
	setup () {
		this.add(this.getVideoFromYouTube);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				videoId: Joi.string().required(),
				all: Joi.bool().optional().default(false),
			}),
		});
	}

	async getVideoFromYouTube (ctx, next) {
		try {
			const { videoId, all } = ctx.request.body;

			const data = await YTDL.getVideoInfo(videoId);
			if (all) {
				return super.success(ctx, next, data);
			}

			const ytdlData = {
				id: data.videoDetails.videoId,
				title: data.videoDetails.title,
				thumbnail_url: data.videoDetails.thumbnails?.reverse()[0]?.url,
				length: data.videoDetails.lengthSeconds,
				age_restricted: data.videoDetails.age_restricted,
			};

			return super.success(ctx, next, ytdlData);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetVideoFromYouTube().middlewares();