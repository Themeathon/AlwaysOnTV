import AbstractParser from '#utils/ytdl/AbstractParser.js';

import { execFile } from 'node:child_process';
import util from 'node:util';

import pino from '#utils/Pino.js';
import { COOKIES_PATH, hasCookies } from '#utils/ytdl/Cookies.js';

const execFilePromise = util.promisify(execFile);

const CONTAINERS = {
	mp4: 'mp4',
	m4a: 'mp4',
	webm: 'webm',
};

const VP9_LEVELS = [
	[10, 36864, 829440],
	[11, 73728, 2764800],
	[20, 122880, 4608000],
	[21, 245760, 9216000],
	[30, 552960, 20736000],
	[31, 983040, 36864000],
	[40, 2228224, 83558400],
	[41, 2228224, 160432128],
	[50, 8912896, 311951360],
	[51, 8912896, 588251136],
	[52, 8912896, 1176502272],
	[60, 35651584, 1176502272],
	[61, 35651584, 2353004544],
	[62, 35651584, 4706009088],
];

function videoCodecString (format) {
	if (format.vcodec !== 'vp9') return format.vcodec;

	const pictureSize = (format.width || 0) * (format.height || 0);
	const sampleRate = pictureSize * (format.fps || 30);
	const [level] = VP9_LEVELS.find(([, maxSize, maxRate]) => pictureSize <= maxSize && sampleRate <= maxRate) || VP9_LEVELS.at(-1);

	return `vp09.00.${level}.08`;
}

export default class YTDlpParser extends AbstractParser {
	async getVideoAndAudioStreams (youtubeID) {
		try {
			pino.info(`[YTDlpParser] Resolving streams for ${youtubeID}`);

			const args = ['-J', '--no-warnings'];

			if (hasCookies()) {
				args.push('--cookies', COOKIES_PATH);
			}

			args.push(`https://www.youtube.com/watch?v=${youtubeID}`);

			const { stdout } = await execFilePromise('yt-dlp', args, { maxBuffer: 1024 * 1024 * 50 });
			const data = JSON.parse(stdout);

			const formats = (data.formats || [])
				.filter(f => f.protocol === 'https' && f.url && CONTAINERS[f.ext])
				.filter(f => !f.format_id.includes('-drc'))
				.filter(f => !f.dynamic_range || f.dynamic_range === 'SDR')
				.map(f => ({ ...f, container: CONTAINERS[f.ext] }));

			const videoFormats = formats
				.filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec === 'none')
				.map(f => ({ ...f, codecs: videoCodecString(f) }));

			const audioFormats = formats
				.filter(f => f.acodec && f.acodec !== 'none' && f.vcodec === 'none')
				.map(f => ({ ...f, codecs: f.acodec }));

			if (!videoFormats.length || !audioFormats.length) {
				return { error: 'NO_VIDEO_OR_AUDIO' };
			}

			return {
				videoFormats,
				audioFormats,
				duration: data.duration || 0,
				details: {
					title: data.title,
					thumbnails: (data.thumbnails || []).filter(t => t.url),
					age_limit: data.age_limit || 0,
				},
			};
		}
		catch (error) {
			pino.error(`[YTDlpParser] yt-dlp failed for ${youtubeID}: ${error.message}`);

			if (/confirm you.?re not a bot/i.test(error.stderr || error.message)) {
				pino.warn(`[YTDlpParser] YouTube bot check hit. ${hasCookies() ? `Cookies in ${COOKIES_PATH} were rejected or expired, export fresh ones.` : `Export YouTube cookies to ${COOKIES_PATH}.`}`);
				return { error: 'YOUTUBE_BOT_CHECK' };
			}

			return { error: 'YTDLP_EXECUTION_FAILED' };
		}
	}
}
