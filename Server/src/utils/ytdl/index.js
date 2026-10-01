import { URL } from 'node:url';

import NodeCache from 'node-cache';
import { Duration } from 'luxon';
import { Innertube, UniversalCache } from 'youtubei.js';
import pino from '#utils/Pino.js';

import { getCookieHeader } from '#utils/ytdl/Cookies.js';

import { buildManifest, probeRanges } from '#utils/ytdl/DashManifest.js';
import YTDlpParser from '#utils/ytdl/YTDlpParser.js';

const ERROR_MESSAGES = {
	YOUTUBE_BOT_CHECK: 'YouTube asked to confirm this server is not a bot. Add YouTube cookies as Server/cookies.txt (see README).',
};

let ytClient;
let ytClientCookie;

export default class YTDL {
	static {
		this.info_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.stream_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.manifest_cache = new NodeCache({ stdTTL: 60 * 60 * 3 }); // 3 hours 
		this.pending_streams = new Map();

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
		const cookie = getCookieHeader('https://www.youtube.com/');

		if (!ytClient || cookie !== ytClientCookie) {
			ytClient = await Innertube.create({
				cache: new UniversalCache(false),
				cookie: cookie || undefined,
			});
			ytClientCookie = cookie;
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

		let mappedInfo = {
			videoDetails: {
				videoId: basicInfo.id,
				title: basicInfo.title,
				thumbnails: [...thumbnails],
				lengthSeconds: basicInfo.duration,
				age_restricted: playStatus.status === 'LOGIN_REQUIRED' || basicInfo.is_unplayable || basicInfo.isUnplayable
			}
		};

		if (!basicInfo.title) {
			pino.warn(`[YTDL] youtubei.js returned no details for ${id} (${playStatus.status}: ${playStatus.reason}), falling back to yt-dlp`);

			const { duration, details } = await this.getCachedVideoAndAudioStreams(id, force);
			mappedInfo = {
				videoDetails: {
					videoId: id,
					title: details.title,
					thumbnails: [...details.thumbnails],
					lengthSeconds: duration,
					age_restricted: details.age_limit >= 18,
				},
			};
		}

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

		if (!force && this.pending_streams.has(id))
			return this.pending_streams.get(id);

		const promise = this.parser.getVideoAndAudioStreams(id)
			.then(({ error, audioFormats, videoFormats, duration, details }) => {
				if (error) throw new Error(ERROR_MESSAGES[error] || error);

				const result = { audioFormats, videoFormats, duration, details };
				this.stream_cache.set(id, result);
				return result;
			})
			.finally(() => this.pending_streams.delete(id));

		this.pending_streams.set(id, promise);
		return promise;
	}

	static getBestVideoAndAudio({ videoFormats, audioFormats }, videoQuality = 1080) {
		const quality = format => Math.min(format.width || 0, format.height || 0);
		const codecRank = format => {
			if (format.vcodec.startsWith('avc1')) return 3;
			if (format.vcodec.startsWith('vp9') || format.vcodec.startsWith('vp09')) return 2;
			return 1;
		};

		const byQuality = (a, b) => quality(b) - quality(a)
			|| (b.fps || 0) - (a.fps || 0)
			|| codecRank(b) - codecRank(a)
			|| (b.tbr || 0) - (a.tbr || 0);

		const sortedVideo = [...videoFormats].sort(byQuality);
		const video = sortedVideo.find(format => quality(format) <= videoQuality) || sortedVideo.at(-1);

		const audio = [...audioFormats].sort((a, b) =>
			(b.language_preference ?? -1) - (a.language_preference ?? -1)
			|| (b.abr || 0) - (a.abr || 0),
		)[0];

		return { video, audio };
	}

	static async getDashMPD(youtubeID, videoQuality = 1080) {
		const id = this.extractID(youtubeID);
		const cacheKey = `${id}:${videoQuality}`;

		if (this.manifest_cache.has(cacheKey))
			return this.manifest_cache.get(cacheKey);

		const streams = await this.getCachedVideoAndAudioStreams(id);
		const { video, audio } = this.getBestVideoAndAudio(streams, videoQuality);

		pino.info(`[YTDL] DASH for ${id}: video ${video.format_id} (${video.width}x${video.height} ${video.vcodec}), audio ${audio.format_id} (${audio.acodec})`);

		const [videoRanges, audioRanges] = await Promise.all([
			probeRanges(video),
			probeRanges(audio),
		]);

		const mpd = buildManifest([
			{ format: video, ranges: videoRanges, baseUrl: `${id}/${video.format_id}` },
			{ format: audio, ranges: audioRanges, baseUrl: `${id}/${audio.format_id}` },
		], streams.duration);

		this.manifest_cache.set(cacheKey, mpd);
		return mpd;
	}

	static async getStreamFormat(youtubeID, formatId, force = false) {
		const { videoFormats, audioFormats } = await this.getCachedVideoAndAudioStreams(youtubeID, force);
		return [...videoFormats, ...audioFormats].find(format => format.format_id === formatId);
	}
}
