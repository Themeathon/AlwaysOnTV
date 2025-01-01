import Config from '~/utils/Config.js';

export default async function checkPassword (ctx, next) {
	if (!Config.password) return next();

	const authorization = ctx.headers.authorization || ctx.cookies.get('password');
	if (!authorization || authorization !== Config.password) {
		ctx.status = 401;
		return;
	}

	return next();
}