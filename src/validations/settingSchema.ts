import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
    monthlyIncome: Joi.number()
        .positive()
        .messages({
            'number.base': 'Monthly income must be a number',
            'number.positive': 'Monthly income must be positive',
            'any.required': 'Monthly income is required'
        }),
    monthlyBudget: Joi.number()
        .positive()
        .messages({
            'number.base': 'Monthly budget must be a number',
            'number.positive': 'Monthly budget must be positive',
            'any.required': 'Monthly budget is required'
        }),
});