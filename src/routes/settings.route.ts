import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import verifyToken from '../middlewares/auth.middleware';
import { validatePayload } from '../middlewares/validation.middleware';
import { updateSettingsSchema } from '../validations/settingSchema';

const router = Router();

router.get('/get-settings', verifyToken, getSettings);
router.put('/update-settings', verifyToken, validatePayload(updateSettingsSchema), updateSettings);

export default router; 