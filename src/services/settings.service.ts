import { UserRepository } from '../repositories/user.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { CustomError } from '../utils/customError';
import { handleServiceError } from '../utils/errorHandler';
import { ERROR_CODES } from '../constants/errorCodes';
import { UserMonthlyFinanceRepository } from '../repositories/userMonthlyFinance.repository';

const userRepository = new UserRepository();
const budgetRepository = new BudgetRepository(require('../models/budget.model').default);
const expenseRepository = new ExpenseRepository();
const userMonthlyFinanceRepository = new UserMonthlyFinanceRepository();

export class SettingsService {
  async getSettings(userId: number) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new CustomError(ERROR_CODES.USER.NOT_FOUND, ["User not found"]);
      }
      // Use UTC for period
      const now = new Date();
      const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const monthlyFinance = await userMonthlyFinanceRepository.findByUserAndPeriod(userId, period);
      const budgets = await budgetRepository.findAllByUserWithCategoryAndSpending(userId, { limit: 100 });
      const expenses = await expenseRepository.findAllByUserId(userId);
      return {
        monthlyIncome: monthlyFinance?.monthly_income ?? null,
        monthlyBudget: monthlyFinance?.monthly_budget ?? null,
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
      if (monthlyIncome == null && monthlyBudget == null) {
        return false;
      }
      // Use UTC for period
      const now = new Date();
      const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      // Fetch existing record for current month
      const existing = await userMonthlyFinanceRepository.findByUserAndPeriod(userId, period);
      // Validation: monthlyIncome must always be greater than monthlyBudget if both provided
      if (
        monthlyIncome != null &&
        monthlyBudget != null &&
        Number(monthlyIncome) <= Number(monthlyBudget)
      ) {
        throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ["Monthly income must be greater than monthly budget"]);
      }
      // If updating (not creating), check if decreases are allowed
      let lockDecrease = false;
      if (existing) {
        // Only check for expenses/budgets if a record exists
        // (if not, it's the first set for the month)
        const [budgets, expenses] = await Promise.all([
          budgetRepository.findAllByUserWithCategoryAndSpending(userId, { limit: 1 }),
          expenseRepository.findAllByUserId(userId)
        ]);
        const hasCurrentMonthBudget = (budgets.data ?? []).some((b: any) => {
          const start = new Date(b.start_date);
          return start.getUTCFullYear() === period.getUTCFullYear() && start.getUTCMonth() === period.getUTCMonth();
        });
        const hasCurrentMonthExpense = (expenses ?? []).some((e: any) => {
          const date = new Date(e.expense_date || e.created_at);
          return date.getUTCFullYear() === period.getUTCFullYear() && date.getUTCMonth() === period.getUTCMonth();
        });
        lockDecrease = hasCurrentMonthBudget || hasCurrentMonthExpense;
      }
      // If decreases are locked, only allow increases
      if (existing && lockDecrease) {
        if (
          monthlyIncome != null &&
          existing.monthly_income != null &&
          Number(monthlyIncome) < Number(existing.monthly_income)
        ) {
          throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ["Monthly income can only be increased for the current month after budgets or expenses exist"]);
        }
        if (
          monthlyBudget != null &&
          existing.monthly_budget != null &&
          Number(monthlyBudget) < Number(existing.monthly_budget)
        ) {
          throw new CustomError(ERROR_CODES.VALIDATION.INVALID_FORMAT, ["Monthly budget can only be increased for the current month after budgets or expenses exist"]);
        }
      }
      // Update or create the record
      await userMonthlyFinanceRepository.createOrUpdateByUserAndPeriod(userId, period, {
        ...(monthlyIncome !== undefined ? { monthly_income: monthlyIncome } : {}),
        ...(monthlyBudget !== undefined ? { monthly_budget: monthlyBudget } : {}),
      });
      return true;
    } catch (error) {
      handleServiceError(error);
    }
  }
}