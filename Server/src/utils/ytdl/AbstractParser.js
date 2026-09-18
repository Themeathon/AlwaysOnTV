export default class AbstractParser {
	// eslint-disable-next-line no-unused-vars
	async getVideoAndAudioStreams (youtubeID) {
		return {
			audioFormats: [],
			videoFormats: [],
			duration: 0,
		};
	}
}
