import Joi from 'joi';

export const createCategorySchema = Joi.object({
    categoryName: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Category name is required',
            'string.min': 'Category name must be at least 1 character long',
            'string.max': 'Category name cannot exceed 50 characters',
            'any.required': 'Category name is required'
        }),
    categoryColor: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'Category color must be a valid hex color (e.g., #FF5733)',
            'any.required': 'Category color is required'
        })
});

export const updateCategorySchema = Joi.object({
    categoryName: Joi.string()
        .min(1)
        .max(50)
        .optional()
        .messages({
            'string.empty': 'Category name cannot be empty',
            'string.min': 'Category name must be at least 1 character long',
            'string.max': 'Category name cannot exceed 50 characters'
        }),
    categoryColor: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Category color must be a valid hex color (e.g., #FF5733)'
        })
}); 