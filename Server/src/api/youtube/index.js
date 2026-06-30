import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';
import GetMPDFromYouTube from './GetMPDFromYouTube.js';
import GetPlaylistFromYouTube from './GetPlaylistFromYouTube.js';
import GetProxiedStreamType from './GetProxiedStreamType.js';
import GetVideoFromYouTube from './GetVideoFromYouTube.js';

class YouTubeRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/youtube' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.post('/get-video', checkPassword, ...GetVideoFromYouTube);
		router.post('/get-playlist', checkPassword, ...GetPlaylistFromYouTube);

		router.get('/get-mpd', ...GetMPDFromYouTube);
		router.get('/:videoId/:streamType', ...GetProxiedStreamType);
	}
}

export default Router => new YouTubeRouter().getRouter(Router);