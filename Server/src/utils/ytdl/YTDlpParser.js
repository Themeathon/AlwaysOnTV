import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import AbstractParser from '~/utils/ytdl/AbstractParser.js';

const execPromise = util.promisify(exec);

export default class YTDlpParser extends AbstractParser {
	async getVideoAndAudioStreams(youtubeID) {
		try {
			console.log(`[AlwaysOnTV] yt-dlp is fetching stream for ID: ${youtubeID}...`);
			const url = `https://www.youtube.com/watch?v=${youtubeID}`;

			const cookiesPath = path.resolve(process.cwd(), 'cookies.txt');
			const hasCookies = fs.existsSync(cookiesPath);
			if (hasCookies) {
				console.log(`[AlwaysOnTV] Using cookies.txt found at ${cookiesPath}`);
			} else {
				console.log(`[AlwaysOnTV] Warning: No cookies.txt found. Running anonymously.`);
			}
			const cookieFlag = hasCookies ? `--cookies "${cookiesPath}"` : '';

			const command = `yt-dlp -J -f "best[ext=mp4][protocol^=http]" ${cookieFlag} --no-warnings ${url}`;

			const { stdout } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
			
			const data = JSON.parse(stdout);
			console.log(`[AlwaysOnTV] yt-dlp successfully resolved stream! Title: ${data.title}`);

			if (data.url) {
				return {
					videoFormats: [{ url: data.url, height: data.height || 720 }],
					audioFormats: [{ url: data.url, audioBitrate: 128 }],
					duration: data.duration || 0
				};
			}

			return { error: 'NO_STREAM_FOUND' };
		} catch (error) {
			console.error('[AlwaysOnTV] yt-dlp execution error:', error.message);
			return { error: 'YTDLP_EXECUTION_FAILED' };
		}
	}
}