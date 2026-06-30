import AbstractRouter from '../AbstractRouter.js';
import checkPassword from '../PasswordMiddleware.js';

import AddVideo from './AddVideo.js';
import DeleteVideoByID from './DeleteVideoByID.js';
import GetAllVideos from './GetAllVideos.js';
import GetVideoByID from './GetVideoByID.js';
import UpdateVideoByID from './UpdateVideoByID.js';
import ScanLocalVideos from './ScanLocalVideos.js';
import UploadThumbnail from './UploadThumbnail.js';

class VideoRouter extends AbstractRouter {
	constructor () {
		super({ prefix: '/api/videos' });
	}

	setupRouter (router) {
		super.setupRouter(router);

		router.use(checkPassword);

		router.get('/', ...GetAllVideos);
		router.get('/:orderBy', ...GetAllVideos);

		router.put('/', ...AddVideo);

		router.get('/id/:id', ...GetVideoByID);
		router.post('/id/:id', ...UpdateVideoByID);
		router.post('/id/:id/delete', ...DeleteVideoByID);

		router.post('/scan-local', ...ScanLocalVideos);
		router.post('/id/:id/thumbnail', ...UploadThumbnail);
	}
}

export default Router => new VideoRouter().getRouter(Router);