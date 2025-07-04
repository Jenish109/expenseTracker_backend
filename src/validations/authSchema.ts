import Joi from 'joi';
import { MESSAGES } from '../utils/constants';

export const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.min': MESSAGES.AUTH.USERNAME_MIN_LENGTH,
            'string.max': MESSAGES.AUTH.USERNAME_MAX_LENGTH,
            'any.required': MESSAGES.AUTH.USERNAME_REQUIRED
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': MESSAGES.AUTH.INVALID_EMAIL,
            'any.required': MESSAGES.AUTH.EMAIL_REQUIRED
        }),
    password: Joi.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': MESSAGES.AUTH.PASSWORD_MIN_LENGTH,
            'string.max': MESSAGES.AUTH.PASSWORD_MAX_LENGTH,
            'string.pattern.base': MESSAGES.AUTH.PASSWORD_PATTERN,
            'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
        })
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': MESSAGES.AUTH.INVALID_EMAIL,
            'any.required': MESSAGES.AUTH.EMAIL_REQUIRED
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
        })
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': MESSAGES.AUTH.TOKEN_REQUIRED
        }),
    password: Joi.string()
        .min(8)
        .max(100)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
            'string.min': MESSAGES.AUTH.PASSWORD_MIN_LENGTH,
            'string.max': MESSAGES.AUTH.PASSWORD_MAX_LENGTH,
            'string.pattern.base': MESSAGES.AUTH.PASSWORD_PATTERN,
            'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
        })
}); 