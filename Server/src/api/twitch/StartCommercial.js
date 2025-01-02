import Joi from 'joi';
import AbstractEndpoint from '~/api/AbstractEndpoint.js';
import Twitch from '~/utils/Twitch.js';

class StartCommercial extends AbstractEndpoint {
  setup() {
    this.add(this.startCommercial);
  }

  getSchema() {
    return Joi.object({
      body: Joi.object({
        duration: Joi.number()
          .valid(30, 60, 90, 120, 150, 180)
          .required()
          .description('Length of the ad in seconds (30, 60, 90, 120, 150, 180)'),
      }),
    });
  }

  async startCommercial(ctx, next) {
    try {
      const { duration } = ctx.request.body;

      const result = await Twitch.startCommercial(duration);

      if (!result) {
        return super.success(ctx, next, {
          message: 'Commercial started successfully.',
        });
      } else {
        return super.success(ctx, next, result);
      }
    } catch (error) {
      return super.error(ctx, error);
    }
  }
}

export default new StartCommercial().middlewares();