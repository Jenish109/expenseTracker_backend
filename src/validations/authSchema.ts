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
        }),
    firstName: Joi.string()
        .required()
        .messages({
            'any.required': MESSAGES.AUTH.FIRST_NAME_REQUIRED
        }),
    lastName: Joi.string()
        .required()
        .messages({
            'any.required': MESSAGES.AUTH.LAST_NAME_REQUIRED
        }),
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .messages({
            'string.email': MESSAGES.AUTH.INVALID_EMAIL,
            'any.required': MESSAGES.AUTH.EMAIL_REQUIRED
        }),
    username: Joi.string()
        .messages({
            'any.required': MESSAGES.AUTH.USERNAME_REQUIRED
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
        })
}).or('email', 'username');

export const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': MESSAGES.AUTH.INVALID_EMAIL,
            'any.required': MESSAGES.AUTH.EMAIL_REQUIRED
        }),
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

export const updateProfileSchema = Joi.object({
    firstName: Joi.string()
        .messages({
            'any.required': MESSAGES.AUTH.FIRST_NAME_REQUIRED
        })
        .optional(),
    lastName: Joi.string()
        .messages({
            'any.required': MESSAGES.AUTH.LAST_NAME_REQUIRED
        })
        .optional(),
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
    }),
    newPassword: Joi.string()
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

export const changeEmailSchema = Joi.object({
    newEmail: Joi.string().email().required().messages({
        'string.email': MESSAGES.AUTH.INVALID_EMAIL,
        'any.required': MESSAGES.AUTH.EMAIL_REQUIRED
    }),
    password: Joi.string().required().messages({
        'any.required': MESSAGES.AUTH.PASSWORD_REQUIRED
    })
});