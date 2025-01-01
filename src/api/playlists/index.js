import AbstractRouter from '~/api/AbstractRouter.js';
import checkPassword from '~/api/PasswordMiddleware.js';

import AddPlaylist from '~/api/playlists/AddPlaylist.js';
import AddVideoToPlaylist from '~/api/playlists/AddVideoToPlaylist.js';
import DeletePlaylistByID from '~/api/playlists/DeletePlaylistByID.js';
import DeleteVideoFromPlaylist from '~/api/playlists/DeleteVideoFromPlaylist.js';
import GetAllPlaylists from '~/api/playlists/GetAllPlaylists.js';
import GetPlaylistByID from '~/api/playlists/GetPlaylistByID.js';
import UpdatePlaylistByID from '~/api/playlists/UpdatePlaylistByID.js';
import UpdateVideoInPlaylist from '~/api/playlists/UpdateVideoInPlaylist.js';

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