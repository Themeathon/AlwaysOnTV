import VideoQueue from '~/queue/VideoQueue.js';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Config from '~/utils/Config.js';

class GetCurrentVideo extends AbstractEndpoint {
	setup () {
		this.add(this.getCurrentVideo);
	}

	async getCurrentVideo (ctx, next) {
		try {
			let video = VideoQueue.getCurrentVideo();

			if ((!video || !video.id) && (Config.useRandomPlaylist || Config.useEntireRandomPlaylist)) {
				video = await VideoQueue.advanceQueue();
			}

			if (!video || !video.id) {
				return super.error(ctx, 'No items in the queue and random playback disabled or failed');
			}

			let responseData;
			if (video.source_type === 'local') {
				responseData = {
					...video,
					stream_url: `/api/local-media/local/${video.id}`,
				};
				delete responseData.video_quality;
				delete responseData.file_path;
			} else {
				responseData = {
					...video,
					video_quality: Config.maxVideoQuality,
					source_type: 'youtube',
				};
			}

			return super.success(ctx, next, responseData);
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new GetCurrentVideo().middlewares();