import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import AddPlaylist from './AddPlaylist.js';
import AddVideoToPlaylist from './AddVideoToPlaylist.js';
import DeletePlaylistByID from './DeletePlaylistByID.js';
import DeleteVideoFromPlaylist from './DeleteVideoFromPlaylist.js';
import GetAllPlaylists from './GetAllPlaylists.js';
import GetPlaylistByID from './GetPlaylistByID.js';
import UpdatePlaylistByID from './UpdatePlaylistByID.js';
import UpdateVideoInPlaylist from './UpdateVideoInPlaylist.js';

class PlaylistRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/playlists' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetAllPlaylists);
		router.put('/', ...AddPlaylist);

		router.get('/id/:id', ...GetPlaylistByID);
		router.post('/id/:id', ...UpdatePlaylistByID);
		router.post('/id/:id/delete', ...DeletePlaylistByID);

		router.put('/id/:id/video', ...AddVideoToPlaylist);
		router.post('/id/:id/video', ...UpdateVideoInPlaylist);
		router.post('/id/:id/video/delete', ...DeleteVideoFromPlaylist);
	}
}

export default Router => new PlaylistRouter().getRouter(Router);