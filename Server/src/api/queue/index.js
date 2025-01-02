import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';
import AddPlaylistToQueue from '~/api/queue/AddPlaylistToQueue.js';
import AddRandomVideosToQueue from '~/api/queue/AddRandomVideosToQueue.js';
import AddVideoToQueue from '~/api/queue/AddVideoToQueue.js';
import ClearQueue from '~/api/queue/ClearQueue.js';
import DeleteVideoFromQueue from '~/api/queue/DeleteVideoFromQueue.js';
import GetCurrentVideo from '~/api/queue/GetCurrentVideo.js';
import GetNextVideo from '~/api/queue/GetNextVideo.js';
import GetQueue from '~/api/queue/GetQueue.js';
import UpdateQueue from '~/api/queue/UpdateQueue.js';
import AddRandomPlaylistToQueue from './AddRandomPlaylistToQueue.js';

class QueueRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/queue' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetQueue);
		router.post('/', ...UpdateQueue);
		router.delete('/', ...ClearQueue);
		router.delete('/:index', ...DeleteVideoFromQueue);

		router.put('/video', ...AddVideoToQueue);
		router.put('/playlist', ...AddPlaylistToQueue);
		router.put('/random', ...AddRandomVideosToQueue);
		router.put('/randomPlaylist', ...AddRandomPlaylistToQueue);

		router.get('/current', ...GetCurrentVideo);
		router.post('/next', ...GetNextVideo);
	}
}

export default Router => new QueueRouter().getRouter(Router);