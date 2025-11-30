import Joi from 'joi';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import GameDatabase from '~/db/GameDatabase.js';

class UpdateGameOrder extends AbstractEndpoint {
	setup () {
		this.add(this.updateOrder);
	}

	getSchema () {
		return Joi.object({
			body: Joi.object({
				id: Joi.string().required(),
				newIndex: Joi.number().required().min(1),
			}),
		});
	}

	async updateOrder (ctx, next) {
		try {
			const { id, newIndex } = ctx.request.body;

			const success = await GameDatabase.moveGame(id, newIndex);

			if (success) {
				return super.success(ctx, next);
			} else {
				return super.error(ctx, 'Failed to move game');
			}
		}
		catch (error) {
			return super.error(ctx, error);
		}
	}
}

export default new UpdateGameOrder().middlewares();