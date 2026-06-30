import ytpl from '@distube/ytpl';
import ytDashManifestGenerator from '@freetube/yt-dash-manifest-generator';
import { Duration } from 'luxon';
import NodeCache from 'node-cache';
import { ServerConfig } from '#utils/Config.js';
import { Innertube, UniversalCache } from 'youtubei.js';

import YTDlpParser from '#utils/ytdl/YTDlpParser.js';

let ytClient;

export default class YTDL {
	static {
		this.info_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.stream_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 

		this.parser = new YTDlpParser();
	}

	static extractID(urlOrId) {
		if (!urlOrId) return urlOrId;
		if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
		const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
		return match ? match[1] : urlOrId;
	}

	static async initYT() {
		if (!ytClient) {
			ytClient = await Innertube.create({ cache: new UniversalCache(false) });
		}
	}

	static async getVideoInfo(youtubeID, force = false) {
		const id = this.extractID(youtubeID);

		if (this.info_cache.has(id) && !force)
			return this.info_cache.get(id);

		await this.initYT();
		
		// FIX: Swapped getInfo out for getBasicInfo to ignore the broken watch page layout scraper
		const info = await ytClient.getBasicInfo(id);

		const basicInfo = info.basic_info || info.basicInfo || {};
		const playStatus = info.playability_status || info.playabilityStatus || {};
		const thumbnails = basicInfo.thumbnail || basicInfo.thumbnails || [];

		const mappedInfo = {
			videoDetails: {
				videoId: basicInfo.id,
				title: basicInfo.title,
				thumbnails: [...thumbnails],
				lengthSeconds: basicInfo.duration,
				age_restricted: playStatus.status === 'LOGIN_REQUIRED' || basicInfo.is_unplayable || basicInfo.isUnplayable
			}
		};

		this.info_cache.set(id, mappedInfo);
		return mappedInfo;
	}

	static async getPlaylistData(playlistID, withVideos = true) {
		return ytpl(playlistID, {
			limit: withVideos ? Infinity : 1,
		});
	}

	static durationStringToSeconds(durationString) {
		const split = durationString.split(':').reverse();
		return Duration.fromObject({
			hours: split[2] || 0,
			minutes: split[1] || 0,
			seconds: split[0] || 0,
		}).as('seconds');
	}

	static async getPlaylist(playlistID, withVideos = true) {
		if (!playlistID || !ytpl.validateID(playlistID)) return false;

		const playlist = await this.getPlaylistData(playlistID, withVideos);

		return {
			id: playlist.id,
			title: playlist.title,
			videoCount: playlist.total_items,
			thumbnail_url: playlist.thumbnail.url,
			videos: withVideos ? playlist.items.map(video => {
				return {
					id: video.id,
					title: video.title,
					thumbnail_url: video.thumbnail,
					length: this.durationStringToSeconds(video.duration),
				};
			}) : [],
		};
	}

	static async getCachedVideoAndAudioStreams(youtubeID, force = false) {
		const id = this.extractID(youtubeID);

		if (this.stream_cache.has(id) && !force)
			return this.stream_cache.get(id);

		const { error, audioFormats, videoFormats, duration } = await this.parser.getVideoAndAudioStreams(id);
		if (error) {
			throw error;
		}

		const result = {
			audioFormats,
			videoFormats,
			duration,
		};

		this.stream_cache.set(id, result);
		return result;
	}

	static async getBestVideoAndAudio(youtubeID, videoQuality = 1080, force = false) {
		const id = this.extractID(youtubeID);
		const { audioFormats, videoFormats, duration, error } = await this.getCachedVideoAndAudioStreams(id, force);

		if (error || !videoFormats?.length || !audioFormats?.length) {
			return {
				error: error || 'NO_VIDEO_OR_AUDIO',
				message: 'No video or audio formats found.',
			};
		}

		const bestVideo = videoFormats
			.filter(format => format.height <= videoQuality && !format.qualityLabel?.endsWith('s'))
			.sort((a, b) => b.height - a.height)[0] || videoFormats[0];

		const bestAudio = audioFormats
			.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0] || audioFormats[0];

		return {
			video: bestVideo,
			audio: bestAudio,
			duration,
		};
	}

	static async getDashMPD(youtubeID, videoQuality = 1080) {
		const id = this.extractID(youtubeID);
		
		try {
			const { video, audio, duration, error } = await this.getBestVideoAndAudio(id, videoQuality);

			if (error === 'NO_VIDEO_OR_AUDIO' || !video || !audio) {
				return await this.getProgressiveStreamFallback(id);
			}

			const api_url = ServerConfig.api_url;
			video.url = `${api_url}/youtube/${id}/video?videoQuality=${videoQuality}`;
			audio.url = `${api_url}/youtube/${id}/audio?videoQuality=${videoQuality}`;

			return ytDashManifestGenerator.generate_dash_file_from_formats([video, audio], duration);
		} catch (e) {
			return await this.getProgressiveStreamFallback(id);
		}
	}

	static async getProgressiveStreamFallback(id) {
		try {
			await this.initYT();
			// FIX: Swapped getInfo for getBasicInfo here to guard the progressive fallback logic
			const info = await ytClient.getBasicInfo(id);
			
			let formats = info.formats || [];
			if (!formats.length) {
				formats = info.streaming_data?.formats || info.streaming_data?.progressiveFormats || [];
			}
			
			const format = formats.sort((a, b) => {
				const heightB = b.height || b.raw_data?.height || 0;
				const heightA = a.height || a.raw_data?.height || 0;
				return heightB - heightA;
			})[0];
			
			let url = format?.url;
			if (!url && typeof format?.decipher === 'function') {
				url = await format.decipher(ytClient.session.player);
			}
			if (url) {
				return { directUrl: url };
			}
		} catch (err) {}
		return { error: 'NO_VIDEO_OR_AUDIO' };
	}
}