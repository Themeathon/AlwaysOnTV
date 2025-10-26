import AbstractQueue from './AbstractQueue.js';
import RandomPlaylistDatabase from '~/db/RandomPlaylistDatabase.js';
import Twitch from '~/utils/Twitch.js';
import Config from '~/utils/Config.js';
import HistoryQueue from '~/queue/HistoryQueue.js';
import ytdl from '~/utils/ytdl/index.js';
import Socket from '~/Socket.js';
import pino from '~/utils/Pino.js';
import { fetchPlaylist, formatVideos} from '~/api/queue/AddRandomPlaylistToQueue.js';

class VideoQueue extends AbstractQueue {
	constructor () {
		super('./queue.json');
	}

	getDefaultData () {
		return {
			current_video: {},
			items: [],
		};
	}

	onQueueChange () {
		Socket.broadcastQueueHistoryUpdate();
	}

	async updateChannelInformation (video) {
		try {
			await Twitch.updateChannelInformation({
				title: video.title,
				game_id: video.game?.id || video.gameId,
			});
		}
		catch (error) {
			pino.error('Error in VideoQueue.updateChannelInformation');
			pino.error(error);
		}
	}

	getCurrentVideo () {
		return this.db.data.current_video;
	}

	hasCurrentVideo () {
		return !!this.getCurrentVideo().id;
	}

	async updateCurrentVideo (video) {
		this.db.data.current_video = video;

		await this.db.write();

		await HistoryQueue.addFirst(video);

		await this.updateChannelInformation(video);
	}

	async add (elements, skipUpdate = false) {
		const wasEmpty = !this.hasItems();

		await super.add(elements);

		if (!this.hasCurrentVideo() && wasEmpty && !skipUpdate) {
			const currentVideo = await this.getAndAdvance();

			await this.updateCurrentVideo(currentVideo);
		}

		return this.db.data;
	}

	async getRandomVideo (amount = 1) {
		return RandomPlaylistDatabase.getRandomVideo(amount);
	}

	// TODO: This can deadlock if only age-restricted videos are in the random playlist
	async advanceQueue () {
		let nextVideo = await super.getAndAdvance();

		if (!nextVideo) {
			pino.info('advanceQueue: Main queue empty, attempting fallback...');
			if (Config.useEntireRandomPlaylist) {
				try {
					await this.addEntireRandomPlaylistToQueue();
					nextVideo = await super.getAndAdvance();
				} catch (error) {
					pino.error({ err: error }, 'advanceQueue: Failed to add/get video from entire random playlist fallback.');
					return false;
				}
			} else if (Config.useRandomPlaylist) {
				pino.info('advanceQueue: Trying to get single random video...');
				const randomVideo = await this.getRandomVideo();
				if (randomVideo) {
					pino.info(`advanceQueue: Got random video: ${randomVideo.id}`);
					nextVideo = randomVideo;
				} else {
					pino.warn('advanceQueue: Random playlist fallback failed (no video returned).');
				}
			} else {
				pino.warn('advanceQueue: No configuration for random playlist or video fallback');
				return false;
			}
		}

		if (!nextVideo) {
			pino.warn('advanceQueue: No next video found after fallbacks.');
			return false;
		}

		pino.info(`advanceQueue: Validating video ID ${nextVideo.id} (Type: ${nextVideo.source_type || 'unknown'})...`);
		if (!(await this.isVideoValid(nextVideo))) {
			pino.warn(`advanceQueue: Video ${nextVideo.id} is not valid, advancing queue again recursively.`);
			return this.advanceQueue();
		}

		await this.updateCurrentVideo(nextVideo);

		Socket.io.emit('next_video');

		return nextVideo;
	}

	async isVideoValid (video) {
		if (!video || !video.id) {
			pino.warn('isVideoValid: Received invalid video object (missing id).');
			return false;
		}

		if (video.source_type === 'local') {
			pino.info(`isVideoValid: Skipping YouTube check for local video ID ${video.id}`);
			return true;
		}

		try {
			pino.info(`isVideoValid: Performing YouTube check for video ID ${video.id}`);
			const info = await ytdl.getVideoInfo(video.id);

			if (info?.videoDetails?.age_restricted) {
				pino.warn(`isVideoValid: YouTube video ${video.id} is age restricted.`);
				return false;
			}

			return true;
		} catch(error) {
			pino.error({ err: error }, `isVideoValid: ytdl check failed for video ID ${video.id}`);
			return false;
		}
	}

	async addEntireRandomPlaylistToQueue () {
		try {
			const playlist = await fetchPlaylist({ use_entire_random_playlist: true });
			await this.add(formatVideos(playlist));
		} catch (error) {
			pino.error({ error }, 'Failed to add entire random playlist to the queue');
			throw new Error('Failed to add entire random playlist');
		}
	}
}

export default new VideoQueue();