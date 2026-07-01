import URL from 'node:url';

import ytDashManifestGenerator from '@freetube/yt-dash-manifest-generator';
import NodeCache from 'node-cache';
import { Duration } from 'luxon';
import { Innertube, UniversalCache } from 'youtubei.js';
import { ServerConfig } from '#utils/Config.js';
import pino from '#utils/Pino.js';

import YTDlpParser from '#utils/ytdl/YTDlpParser.js';

let ytClient;

export default class YTDL {
	static {
		this.info_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.stream_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 

		this.parser = new YTDlpParser();
	}

	static extractID(urlOrId, type = 'video') {
		if (!urlOrId) return urlOrId;

		// Videos are exactly 11 characters; Playlists are typically 18 to 40 characters
		const cleanIdRegex = type === 'video' ? /^[a-zA-Z0-9_-]{11}$/ : /^[a-zA-Z0-9_-]{18,40}$/;
		if (cleanIdRegex.test(urlOrId)) return urlOrId;

		try {
			const url = new URL(urlOrId);

			if (type === 'playlist') {
				return url.searchParams.get('list') || urlOrId;
			}

			if (url.hostname === 'youtu.be') {
				return url.pathname.slice(1);
			}
			return url.searchParams.get('v') || url.pathname.split('/').pop();
		} catch {
			return urlOrId;
		}
	}

	static async initYT() {
		if (!ytClient) {
            ytClient = await Innertube.create({ 
                cache: new UniversalCache(false)
            });
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

	static async getPlaylistData(playlistID) {
		await this.initYT();
		const playlistId = YTDL.extractID(playlistID, 'playlist');
		return await ytClient.getPlaylist(playlistId);
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
		if (!playlistID) return false;

		try {
			let playlist = await this.getPlaylistData(playlistID);
			const info = playlist.info || {};

			const mappedPlaylist = {
				id: playlist.id || playlistID,
				title: info.title || 'Unknown Playlist',
				videoCount: info.total_items || playlist.items?.length || 0,
				thumbnail_url: info.thumbnails?.[0]?.url || info.thumbnail?.url || '',
				videos: []
			};
    
			if (withVideos && playlist.items) {
				const allItems = playlist.items;

				while (playlist.has_continuation) {
					playlist = await playlist.getContinuation();
					if (playlist.items) {
						allItems.push(...playlist.items);
					}
				}

				mappedPlaylist.videos = allItems
					.map(({
						content_id,
						id,
						metadata,
						content_image,
						title,
						thumbnails,
						thumbnail,
						duration
					}) => {
						const videoId = content_id || id;
						if (!videoId) return null;

						const imageArray = content_image?.image || thumbnails || thumbnail;
						const badgeText = content_image?.overlays?.[0]?.badges?.[0]?.text;

						return {
							id: videoId,
							title: metadata?.title?.text || title?.toString() || 'Unknown Video',
							thumbnail_url: Array.isArray(imageArray) ? imageArray[0]?.url : (imageArray?.url || ''),
							length: badgeText ? this.durationStringToSeconds(badgeText) : (duration?.seconds || 0),
							source_type: 'youtube'
						};
					})
					.filter(Boolean); 
			}
            
			return mappedPlaylist;
		} catch (error) {
			pino.error('Failed to parse YouTube playlist');
			pino.error(error);
			throw error;
		}
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
		} catch {
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
		} catch {
			return { error: 'NO_VIDEO_OR_AUDIO' };
		}

		return { error: 'NO_VIDEO_OR_AUDIO' };
	}
}