import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';
import AddPlaylistToQueue from './AddPlaylistToQueue.js';
import AddRandomVideosToQueue from './AddRandomVideosToQueue.js';
import AddVideoToQueue from './AddVideoToQueue.js';
import ClearQueue from './ClearQueue.js';
import DeleteVideoFromQueue from './DeleteVideoFromQueue.js';
import GetCurrentVideo from './GetCurrentVideo.js';
import GetNextVideo from './GetNextVideo.js';
import GetQueue from './GetQueue.js';
import UpdateQueue from './UpdateQueue.js';
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