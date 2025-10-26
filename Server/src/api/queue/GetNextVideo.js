import VideoQueue from '~/queue/VideoQueue.js';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';
// import pino from '~/utils/Pino.js';

class GetNextVideo extends AbstractEndpoint {
	setup () {
		this.add(this.getNextVideo);
	}

	async getNextVideo (ctx, next) {
		try {
			const video = await VideoQueue.advanceQueue();

			if (!video) {
				return super.error(ctx, 'No more items in the queue');
			}

			let responseData;

			if (video.source_type === 'local') {
				if (!video.id) {
					throw new Error('Local video object invalid');
				}
				// pino.info(`GetNextVideo: Processing as local video (ID: ${video.id})`);
				responseData = {
					...video,
					stream_url: `/api/local-media/local/${video.id}`,
				};
				delete responseData.video_quality;
				delete responseData.file_path;
			} else if (video.source_type === 'youtube') {
				if (!video.id) {
					throw new Error('YouTube video object invalid');
				}
				// pino.info(`GetNextVideo: Processing as YouTube video (ID: ${video.id})`);
				responseData = {
					...video,
					video_quality: Config.maxVideoQuality,
					source_type: 'youtube',
				};
				delete responseData.stream_url;
				delete responseData.file_path;
			} else {
				throw new Error(`Unknown or missing video source_type: ${video.source_type}`);
			}

			// pino.info(`GetNextVideo: Sending video data for ID ${responseData.id}`);
			return super.success(ctx, next, responseData);

		} catch (error) {
			return super.error(ctx, error.message || 'An internal error occurred in GetNextVideo');
		}
	}
}

export default new GetNextVideo().middlewares();