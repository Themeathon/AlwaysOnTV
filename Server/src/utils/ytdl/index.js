import ytpl from '@distube/ytpl';
import ytDashManifestGenerator from '@freetube/yt-dash-manifest-generator';
import { Duration } from 'luxon';
import NodeCache from 'node-cache';
import { ServerConfig } from '~/utils/Config.js';
import InnertubeParser from '~/utils/ytdl/InnertubeParser.js';
import YTDLParser from '~/utils/ytdl/YTDLParser.js';
import { Innertube, UniversalCache } from 'youtubei.js';

let ytClient;

export default class YTDL {
	static {
		this.info_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.stream_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.useYTDL = true;
		this.parser = this.useYTDL ? new YTDLParser() : new InnertubeParser();
	}

	// NEW: Utility to extract ID from full URLs 
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
		const info = await ytClient.getBasicInfo(id);

		// Mock the ytdl-core data structure 
		const mappedInfo = {
			videoDetails: {
				videoId: info.basic_info.id,
				title: info.basic_info.title,
				// Clone array to prevent reverse() from mutating the original cache reference 
				thumbnails: [...info.basic_info.thumbnail],
				lengthSeconds: info.basic_info.duration,
				age_restricted: info.playability_status?.status === 'LOGIN_REQUIRED' || info.basic_info.is_unplayable
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

		// Safely pass the pure ID to our Parser 
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

		// Choose best video under the quality limit 
		const bestVideo = videoFormats
			.filter(format => format.height <= videoQuality && !format.qualityLabel?.endsWith('s'))
			.sort((a, b) => b.height - a.height)[0] || videoFormats[0];

		// Choose the highest bitrate audio 
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
		const { video, audio, duration, error } = await this.getBestVideoAndAudio(id, videoQuality);

		if (error === 'NO_VIDEO_OR_AUDIO') {
			return {
				error,
			};
		}

		const api_url = ServerConfig.api_url;

		video.url = `${api_url}/youtube/${id}/video?videoQuality=${videoQuality}`;
		audio.url = `${api_url}/youtube/${id}/audio?videoQuality=${videoQuality}`;

		return ytDashManifestGenerator.generate_dash_file_from_formats([video, audio], duration);
	}
}