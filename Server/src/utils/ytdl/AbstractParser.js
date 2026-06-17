export default class AbstractParser {
	mergeFormats(formats) {
		const audioFormats = [];
		const videoFormats = [];

		for (const format of formats) {
			// Manually determine if the format has audio/video based on mimeType and properties 
			const mimeType = format.mimeType || '';
			const hasAudio = mimeType.startsWith('audio') || !!format.audioBitrate || !!format.audioChannels;
			const hasVideo = mimeType.startsWith('video') || !!format.width || !!format.height;

			if (hasAudio && !hasVideo) {
				audioFormats.push({
					...format,
					hasAudio,
					hasVideo
				});
			}
			else if (hasVideo && !hasAudio) {
				videoFormats.push({
					...format,
					hasAudio,
					hasVideo
				});
			}
		}

		return {
			audioFormats,
			videoFormats,
		};
	}

	// eslint-disable-next-line no-unused-vars 
	async getVideoAndAudioStreams(youtubeID) {
		return {
			audioFormats: [],
			videoFormats: [],
			duration: 0,
		};
	}
}