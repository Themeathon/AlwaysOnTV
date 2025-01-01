import ytdl from '@distube/ytdl-core';
import ytpl from '@distube/ytpl';
import ytDashManifestGenerator from '@freetube/yt-dash-manifest-generator';
import { Duration } from 'luxon';
import NodeCache from 'node-cache';
import { ServerConfig } from '~/utils/Config.js';
import InnertubeParser from '~/utils/ytdl/InnertubeParser.js';
import YTDLParser from '~/utils/ytdl/YTDLParser.js';

export default class YTDL {
	static {
		this.info_cache = new NodeCache({
			stdTTL: 60 * 60 * 3, // 3 hours
		});

		this.stream_cache = new NodeCache({
			stdTTL: 60 * 60 * 3, // 3 hours
		});

		this.useYTDL = true;

		this.parser = this.useYTDL ? new YTDLParser() : new InnertubeParser();
	}

	static async getVideoInfo (youtubeID, force = false) {
		if (this.info_cache.has(youtubeID) && !force)
			return this.info_cache.get(youtubeID);

		const info = await ytdl.getInfo(youtubeID);

		this.info_cache.set(youtubeID, info);

		return info;
	}

	static async getPlaylistData (playlistID, withVideos = true) {
		return ytpl(playlistID, {
			limit: withVideos ? Infinity : 1,
		});
	}

	static durationStringToSeconds (durationString) {
		const split = durationString.split(':').reverse();

		return Duration.fromObject({
			hours: split[2] || 0,
			minutes: split[1] || 0,
			seconds: split[0] || 0,
		}).as('seconds');
	}

	static async getPlaylist (playlistID, withVideos = true) {
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

	static async getCachedVideoAndAudioStreams (youtubeID, force = false) {
		if (this.stream_cache.has(youtubeID) && !force)
			return this.stream_cache.get(youtubeID);

		const { error, audioFormats, videoFormats, duration } = await this.parser.getVideoAndAudioStreams(youtubeID);
		if (error) {
			throw error;
		}

		const result = {
			audioFormats,
			videoFormats,
			duration,
		};

		this.stream_cache.set(youtubeID, result);

		return result;
	}

	static async getBestVideoAndAudio (youtubeID, videoQuality = 1080, force = false) {
		const { audioFormats, videoFormats, duration } = await this.getCachedVideoAndAudioStreams(youtubeID, force);

		if (!videoFormats?.length || !audioFormats?.length) {
			return {
				error: 'NO_VIDEO_OR_AUDIO',
				message: 'No video or audio formats found.',
			};
		}

		const bestVideo = ytdl.chooseFormat(videoFormats, {
			filter: format => {
				if (!format.hasVideo) return false;
				if (format.hasAudio) return false;
				if (!format.initRange || !format.indexRange) return false;
				if (format.height > videoQuality) return false;

				return true;
			},
		});

		const bestAudio = ytdl.chooseFormat(audioFormats, {
			filter: 'audioonly',
		});

		return {
			video: bestVideo,
			audio: bestAudio,
			duration,
		};
	}

	static async getDashMPD (youtubeID, videoQuality = 1080) {
		const { video, audio, duration, error } = await this.getBestVideoAndAudio(youtubeID, videoQuality);

		if (error === 'NO_VIDEO_OR_AUDIO') {
			return {
				error,
			};
		}

		const api_url = ServerConfig.api_url;

		video.url = `${api_url}/youtube/${youtubeID}/video?videoQuality=${videoQuality}`;
		audio.url = `${api_url}/youtube/${youtubeID}/audio?videoQuality=${videoQuality}`;

		return ytDashManifestGenerator.generate_dash_file_from_formats([video, audio], duration);
	}
}
