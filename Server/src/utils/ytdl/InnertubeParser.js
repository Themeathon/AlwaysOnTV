import got from 'got';
import AbstractParser from '~/utils/ytdl/AbstractParser.js';

// Adapted from https://github.com/user234683/youtube-local/blob/master/youtube/watch.py
export default class InnertubeParser extends AbstractParser {
	constructor () {
		super();

		this.INNERTUBE_CLIENTS = {
			android: {
				INNERTUBE_API_KEY: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
				INNERTUBE_CONTEXT: {
					client: {
						hl: 'en',
						gl: 'US',
						clientName: 'ANDROID',
						clientVersion: '17.31.35',
						osName: 'Android',
						osVersion: '12',
						androidSdkVersion: 31,
						userAgent: 'com.google.android.youtube/17.31.35 (Linux; U; Android 12) gzip',
					},
				},
				INNERTUBE_CONTEXT_CLIENT_NAME: 3,
				REQUIRE_JS_PLAYER: false,
			},
		};
	}

	async getInnertubeForYoutubeID (youtubeID) {
		const client_params = this.INNERTUBE_CLIENTS['android'];
		const context = client_params['INNERTUBE_CONTEXT'];
		const key = client_params['INNERTUBE_API_KEY'];
		const host = 'www.youtube.com';
		const user_agent = context['client'].userAgent;

		const url = 'https://' + host + '/youtubei/v1/player?key=' + key;

		const data = {
			videoId: youtubeID,
			context,
			params: '8AEB',
		};

		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': user_agent,
		};

		const res = await got.post(url, {
			body: JSON.stringify(data),
			headers,
		});

		return JSON.parse(res.body);
	}

	async getVideoAndAudioStreams (youtubeID) {
		const data = await this.getInnertubeForYoutubeID(youtubeID);
		if (!data.streamingData) {
			return {
				error: 'no_streaming_data',
			};
		}

		const { streamingData } = data;

		if (!streamingData.adaptiveFormats.length) {
			return {
				error: 'possibly_age_restricted',
			};
		}

		return {
			...this.mergeFormats(streamingData.adaptiveFormats),
			duration: data.videoDetails.lengthSeconds,
		};
	}
}