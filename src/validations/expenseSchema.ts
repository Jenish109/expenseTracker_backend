import Joi from 'joi';
import { MESSAGES } from '../utils/constants';

export const createExpenseSchema = Joi.object({
    expense_name: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
        'string.min': 'Expense name must be at least 3 characters',
        'string.max': 'Expense name cannot exceed 200 characters',
        'any.required': 'Expense name is required'
    }),
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
});

export const updateExpenseSchema = Joi.object({
    category_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Category ID must be a number',
            'number.integer': 'Category ID must be an integer',
            'any.required': 'Category ID is required'
        }),
    amount: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be positive',
            'any.required': 'Amount is required'
        }),
    expense_name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Expense name must be at least 3 characters',
            'string.max': 'Expense name cannot exceed 100 characters',
            'any.required': 'Expense name is required'
        }),
    description: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.min': 'Description must be at least 3 characters',
            'string.max': 'Description cannot exceed 200 characters',
            'any.required': 'Description is required'
        })
}); 