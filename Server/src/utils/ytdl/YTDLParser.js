import { Innertube, UniversalCache, ClientType } from 'youtubei.js';
import AbstractParser from '~/utils/ytdl/AbstractParser.js';

let ytClient;

export default class YTDLParser extends AbstractParser {
	async init() {
		if (!ytClient) {
			ytClient = await Innertube.create({ 
				cache: new UniversalCache(false),
				client_type: 'TVHTML5'
			});
		}
	}

	async getVideoAndAudioStreams(youtubeID) {
		await this.init();

		try {
			const info = await ytClient.getBasicInfo(youtubeID);
			
			// 1. Get Progressive Streams (Unified Video + Audio)
			const progressive = info.streaming_data?.formats || [];
			// 2. Get Adaptive Streams (for fallback)
			const adaptive = info.streaming_data?.adaptive_formats || [];
			
			const allFormats = [...progressive, ...adaptive];
			
			// Extract a valid URL from any format
			for (const f of allFormats) {
				let url = f.url;
				if (!url && typeof f.decipher === 'function') {
					url = await f.decipher(ytClient.session.player).catch(() => null);
				}
				if (url) {
					return {
						videoFormats: [{ url, height: f.height || 1080 }],
						audioFormats: [{ url, audioBitrate: 128 }],
						duration: info.basic_info?.duration || 0
					};
				}
			}

			return { error: 'NO_VIDEO_OR_AUDIO' };
		} catch (error) {
			return { error: error.message };
		}
	}
}