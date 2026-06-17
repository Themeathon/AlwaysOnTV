import { Innertube, UniversalCache } from 'youtubei.js';
import AbstractParser from '~/utils/ytdl/AbstractParser.js';

let ytClient;

export default class YTDLParser extends AbstractParser {
	async init() {
		if (!ytClient) {
			ytClient = await Innertube.create({ cache: new UniversalCache(false) });
		}
	}

	async getVideoAndAudioStreams(youtubeID) {
		await this.init();

		try {
			// Fetch the video data using youtubei.js 
			const info = await ytClient.getBasicInfo(youtubeID);

			if (info.playability_status?.status === 'LOGIN_REQUIRED' || info.basic_info.is_unplayable) {
				return { error: 'age_restricted' };
			}

			const formats = info.streaming_data?.adaptive_formats || [];

			// Map LuanRT formats to what your DASH generator expects 
			const audioFormats = formats.filter(f => f.has_audio && !f.has_video).map(f => ({
				url: f.url || f.decipher(ytClient.session.player),
				audioBitrate: f.bitrate,
				mimeType: f.mime_type,
				initRange: f.init_range,
				indexRange: f.index_range,
				hasAudio: true,
				hasVideo: false
			}));

			const videoFormats = formats.filter(f => f.has_video && !f.has_audio).map(f => ({
				url: f.url || f.decipher(ytClient.session.player),
				qualityLabel: f.quality_label || `${f.height}p`,
				height: f.height,
				mimeType: f.mime_type,
				initRange: f.init_range,
				indexRange: f.index_range,
				hasVideo: true,
				hasAudio: false
			}));

			return {
				audioFormats,
				videoFormats,
				duration: info.basic_info.duration
			};
		} catch (error) {
			return { error: error.message };
		}
	}
}