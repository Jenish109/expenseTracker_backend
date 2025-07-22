import Joi from 'joi';

export const monthlyDataSchema = Joi.object({
    monthly_budget: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Monthly budget must be a number',
            'number.positive': 'Monthly budget must be positive',
            'any.required': 'Monthly budget is required'
        }),
    monthly_income: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Monthly income must be a number',
            'number.positive': 'Monthly income must be positive',
            'any.required': 'Monthly income is required'
        })
});

export const deleteAccountSchema = Joi.object({
    password: Joi.string().required().messages({
        'any.required': 'Password is required to delete account.'
    })
});

export const monthlyFinanceSchema = Joi.object({
  monthly_budget: Joi.number().positive().required().messages({
    'number.base': 'Monthly budget must be a number',
    'number.positive': 'Monthly budget must be positive',
    'any.required': 'Monthly budget is required'
  }),
  monthly_income: Joi.number().min(0).required().messages({
    'number.base': 'Monthly income must be a number',
    'number.positive': 'Monthly income must be positive',
    'any.required': 'Monthly income is required'
  })
}); 