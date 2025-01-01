import AbstractRouter from '~/api/AbstractRouter.js';

import GetAllVideos from '~/api/random-playlist/GetAllVideos.js';
import GetRandomVideo from '~/api/random-playlist/GetRandomVideo.js';

import AddVideosToPlaylist from '~/api/random-playlist/AddVideosToPlaylist.js';
import DeleteVideosFromPlaylist from '~/api/random-playlist/DeleteVideosFromPlaylist.js';
import checkPassword from '~/api/PasswordMiddleware.js';

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