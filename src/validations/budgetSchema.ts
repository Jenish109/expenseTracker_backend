import Joi from 'joi';

export const createBudgetSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Budget amount must be a number',
            'number.positive': 'Budget amount must be positive',
            'any.required': 'Budget amount is required'
        }),
    categoryId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Category ID must be a number',
            'number.integer': 'Category ID must be an integer',
            'any.required': 'Category ID is required'
        }),
    startDate: Joi.date()
        .required()
        .messages({
            'date.base': 'Invalid start date format',
            'any.required': 'Start date is required'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .required()
        .messages({
            'date.base': 'Invalid end date format',
            'date.min': 'End date must be after start date',
            'any.required': 'End date is required'
        })
});

export const updateBudgetSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .messages({
            'number.base': 'Budget amount must be a number',
            'number.positive': 'Budget amount must be positive'
        }),
    categoryId: Joi.number()
        .integer()
        .positive()
        .messages({
            'number.base': 'Category ID must be a number',
            'number.integer': 'Category ID must be an integer'
        }),
    startDate: Joi.date()
        .messages({
            'date.base': 'Invalid start date format'
        }),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .messages({
            'date.base': 'Invalid end date format',
            'date.min': 'End date must be after start date'
        })
}).min(1); 