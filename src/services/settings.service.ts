import { UserRepository } from '../repositories/user.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { CustomError } from '../utils/customError';
import { handleServiceError } from '../utils/errorHandler';
import { ERROR_CODES } from '../constants/errorCodes';

const userRepository = new UserRepository();
const budgetRepository = new BudgetRepository(require('../models/budget.model').default);
const expenseRepository = new ExpenseRepository();

export class SettingsService {
    async getSettings(userId: number) {
      try {
        const user = await userRepository.findById(userId);
        if (!user) {
          throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }
        const budgets = await budgetRepository.findAllByUserWithCategoryAndSpending(userId, { limit: 100 });
        const expenses = await expenseRepository.findAllByUserId(userId);
        return {
          monthlyIncome: user.monthly_income ?? null,
          monthlyBudget: user.monthly_budget ?? null,
          budgets: budgets.data ?? [],
          expenses: expenses ?? [],
        };
      } catch (error) {
        handleServiceError(error);
      }
    }
  
    async updateSettings(userId: number, data: { monthlyIncome?: number; monthlyBudget?: number }) {
      try {
        const user = await userRepository.findById(userId);
        if (!user) {
          throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
        }
        const { monthlyIncome, monthlyBudget } = data;
        let updated = false;
        if (monthlyIncome !== undefined || monthlyBudget !== undefined) {
          await userRepository.update(
            {
              ...(monthlyIncome !== undefined ? { monthly_income: monthlyIncome } : {}),
              ...(monthlyBudget !== undefined ? { monthly_budget: monthlyBudget } : {}),
            },
            { where: { user_id: userId } }
          );
          updated = true;
        }
        return updated;
      } catch (error) {
        handleServiceError(error);
      }
    }
  }