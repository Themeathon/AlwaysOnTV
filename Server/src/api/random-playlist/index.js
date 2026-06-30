import AbstractRouter from '../AbstractRouter.js';

import GetAllVideos from './GetAllVideos.js';
import GetRandomVideo from './GetRandomVideo.js';

import AddVideosToPlaylist from './AddVideosToPlaylist.js';
import DeleteVideosFromPlaylist from './DeleteVideosFromPlaylist.js';
import checkPassword from '../PasswordMiddleware.js';

class RandomPlaylistRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/random-playlist' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetAllVideos);
		router.get('/random', ...GetRandomVideo);
		router.put('/', ...AddVideosToPlaylist);
		router.post('/delete', ...DeleteVideosFromPlaylist);
	}
}

export default Router => new RandomPlaylistRouter().getRouter(Router);