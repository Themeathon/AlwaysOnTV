import Config from '#utils/Config.js';

export default async function checkPassword (ctx, next) {
	if (!Config.isAuthorized(ctx.headers.authorization || ctx.cookies.get('password'))) {
		ctx.status = 401;
		return;
	}

	return next();
}
