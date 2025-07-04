import Joi from 'joi';
import { MESSAGES } from '../utils/constants';

export const createExpenseSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be positive',
            'any.required': 'Amount is required'
        }),
    description: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.min': 'Description must be at least 3 characters',
            'string.max': 'Description cannot exceed 200 characters',
            'any.required': 'Description is required'
        }),
    category_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Category ID must be a number',
            'number.integer': 'Category ID must be an integer',
            'any.required': 'Category ID is required'
        }),
    expense_date: Joi.date()
        .max('now')
        .default(new Date())
        .messages({
            'date.base': 'Invalid date format',
            'date.max': 'Date cannot be in the future'
        })
});

export const updateExpenseSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be positive'
        }),
    description: Joi.string()
        .min(3)
        .max(200)
        .messages({
            'string.min': 'Description must be at least 3 characters',
            'string.max': 'Description cannot exceed 200 characters'
        }),
    category_id: Joi.number()
        .integer()
        .positive()
        .messages({
            'number.base': 'Category ID must be a number',
            'number.integer': 'Category ID must be an integer'
        }),
    expense_date: Joi.date()
        .max('now')
        .messages({
            'date.base': 'Invalid date format',
            'date.max': 'Date cannot be in the future'
        })
}).min(1); 