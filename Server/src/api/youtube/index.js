import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';
import GetMPDFromYouTube from '~/api/youtube/GetMPDFromYouTube.js';
import GetPlaylistFromYouTube from '~/api/youtube/GetPlaylistFromYouTube.js';
import GetProxiedStreamType from '~/api/youtube/GetProxiedStreamType.js';
import GetVideoFromYouTube from '~/api/youtube/GetVideoFromYouTube.js';

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