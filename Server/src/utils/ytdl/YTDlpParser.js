import AbstractParser from '#utils/ytdl/AbstractParser.js';

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import util from 'node:util';

import pino from '#utils/Pino.js';

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

			const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
			if (fs.existsSync(cookiesPath)) {
				args.push('--cookies', cookiesPath);
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
			};
		}
		catch (error) {
			pino.error(`[YTDlpParser] yt-dlp failed for ${youtubeID}: ${error.message}`);
			return { error: 'YTDLP_EXECUTION_FAILED' };
		}
	}
}
