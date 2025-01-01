import { addFormatMeta } from '@distube/ytdl-core/lib/format-utils.js';

export default class AbstractParser {
	mergeFormats (formats) {
		const audioFormats = [];
		const videoFormats = [];

		for (const format of formats) {
			const metaFormat = addFormatMeta(format);

			if (metaFormat.hasAudio && !metaFormat.hasVideo) {
				audioFormats.push({
					...metaFormat,
				});
			}
			else if (metaFormat.hasVideo && !metaFormat.hasAudio) {
				videoFormats.push({
					...metaFormat,
				});
			}
		}

		return {
			audioFormats,
			videoFormats,
		};
	}

	// eslint-disable-next-line no-unused-vars
	async getVideoAndAudioStreams (youtubeID) {
		return {
			audioFormats: [],
			videoFormats: [],
			duration: 0,
		};
	}
}
