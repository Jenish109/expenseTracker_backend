import Joi from 'joi';

export const monthlyDataSchema = Joi.object({
    month: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .required()
        .messages({
            'number.base': 'Month must be a number',
            'number.integer': 'Month must be an integer',
            'number.min': 'Month must be between 1 and 12',
            'number.max': 'Month must be between 1 and 12',
            'any.required': 'Month is required'
        }),
    year: Joi.number()
        .integer()
        .min(2000)
        .max(2100)
        .required()
        .messages({
            'number.base': 'Year must be a number',
            'number.integer': 'Year must be an integer',
            'number.min': 'Year must be after 2000',
            'number.max': 'Year must be before 2100',
            'any.required': 'Year is required'
        }),
    budget: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Budget must be a number',
            'number.positive': 'Budget must be positive',
            'any.required': 'Budget is required'
        })
}); 