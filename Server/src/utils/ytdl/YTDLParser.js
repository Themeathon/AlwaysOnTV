import ytdl from '@distube/ytdl-core';
import AbstractParser from '~/utils/ytdl/AbstractParser.js';
import YTDL from '~/utils/ytdl/index.js';

export default class YTDLParser extends AbstractParser {
	async getVideoAndAudioStreams (youtubeID) {
		const info = await YTDL.getVideoInfo(youtubeID);

		if (info.videoDetails.age_restricted) {
			return {
				error: 'age_restricted',
			};
		}

		const audioFormats = ytdl.filterFormats(info.formats, format => {
			if (!format.hasAudio) return false;
			if (format.hasVideo) return false;
			if (!format.initRange || !format.indexRange) return false;

			return format.audioQuality === 'AUDIO_QUALITY_MEDIUM';
		});

		const videoFormats = ytdl.filterFormats(info.formats, format => {
			if (!format.hasVideo) return false;
			if (format.hasAudio) return false;
			if (!format.initRange || !format.indexRange) return false;

			// 360 degree check, somehow not fully supported with AVMerge
			if (format.qualityLabel.endsWith('s')) return false;

			return true;
		});

		return {
			audioFormats,
			videoFormats,
			duration: info.videoDetails.lengthSeconds,
		};
	}
}