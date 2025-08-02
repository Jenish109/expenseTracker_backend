import Joi from 'joi';

export const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  subject: Joi.string().allow('').optional(),
  message: Joi.string().allow('').optional(),
});
