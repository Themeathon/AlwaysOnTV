import Joi from 'joi';

import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
import Utils from '~/utils/index.js';
import YTDL from '~/utils/ytdl/index.js';
import pino from '~/utils/Pino.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

class GetProxiedStreamType extends AbstractEndpoint {
	setup () {
		this.add(this.getVideoQuality);
		this.add(this.getProxiedMPDValue);
	}

	getSchema () {
		return Joi.object({
			params: Joi.object({
				videoId: Joi.string().required(),
				streamType: Joi.string().required().allow('video', 'audio'),
			}),
			query: Joi.object({
				videoQuality: Joi.number().default(Config.maxVideoQuality),
			}),
		});
	}

	async getVideoQuality (ctx, next) {
		const { videoQuality } = ctx.request.query;

		ctx.videoQuality = videoQuality || Config.maxVideoQuality;

		return next();
	}

	async getProxiedMPDValue (ctx, next) {
		const { videoId, streamType } = ctx.params;
		const { videoQuality } = ctx;

		try {
			const { video, audio, error } = await YTDL.getBestVideoAndAudio(videoId, videoQuality);

			if (error || !video || !audio) {
				ctx.status = 404;
				ctx.body = { error: 'Not Found', message: 'Stream not available' };
				return;
			}

			const targetUrl = streamType === 'video' ? video.url : audio.url;
			
			// FIX: Redirect the browser directly to YouTube. 
			// Do NOT use Utils.proxy() here.
			ctx.redirect(targetUrl);
		} catch (e) {
			ctx.status = 500;
			ctx.body = { error: e.message };
		}
	}
}

export default new GetProxiedStreamType().middlewares();