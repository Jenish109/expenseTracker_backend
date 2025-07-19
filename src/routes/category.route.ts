import express, { Router } from 'express';
import verifyToken from '../middlewares/auth.middleware';
import { CategoryController } from '../controllers/category.controller';
import { validatePayload } from '../middlewares/validation.middleware';
import { createCategorySchema, updateCategorySchema } from '../validations/categorySchema';

const categoryRoute: Router = express.Router();
const categoryController = new CategoryController();

// Category routes
categoryRoute.get('/', verifyToken, categoryController.getCategoriesForUser.bind(categoryController));
categoryRoute.get('/user', verifyToken, categoryController.getUserCategories.bind(categoryController));
categoryRoute.post('/', 
    verifyToken, 
    validatePayload(createCategorySchema),
    categoryController.createCategory.bind(categoryController)
);
categoryRoute.put('/:id', 
    verifyToken, 
    validatePayload(updateCategorySchema),
    categoryController.updateCategory.bind(categoryController)
);
categoryRoute.delete('/:id', verifyToken, categoryController.deleteCategory.bind(categoryController));

// Admin route for all categories (backward compatibility)
categoryRoute.get('/all', verifyToken, categoryController.getAllCategories.bind(categoryController));

export default categoryRoute; 