import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { successResponse, errorResponse } from '../utils/response.helper';
import { SUCCESS_CODES } from '../constants/successCodes';
import { handleControllerError } from '../utils/errorHandler';
import { ERROR_CODES } from '../constants/errorCodes';

const settingsService = new SettingsService();

export const getSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
        return errorResponse(res, ERROR_CODES.AUTH.INVALID_TOKEN.message, ERROR_CODES.AUTH.INVALID_TOKEN.statusCode);
    }
    const settings = await settingsService.getSettings(userId);
    return successResponse(
      res,
      settings,
      SUCCESS_CODES.SETTINGS.RETRIEVED.message,
      SUCCESS_CODES.SETTINGS.RETRIEVED.status_code
    );
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
            return errorResponse(res, ERROR_CODES.AUTH.INVALID_TOKEN.message, ERROR_CODES.AUTH.INVALID_TOKEN.statusCode);
    }
    const { monthlyIncome, monthlyBudget } = req.body;
    await settingsService.updateSettings(userId, { monthlyIncome, monthlyBudget });
    return successResponse(
      res,
      null,
      SUCCESS_CODES.SETTINGS.UPDATED.message,
      SUCCESS_CODES.SETTINGS.UPDATED.status_code
    );
  } catch (error) {
    handleControllerError(res, error);
  }
}; 