import { Router } from 'express';
import { getSettings, updateSettings, updateStreak } from '../controllers/userController.js';

const router = Router();

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/streak/update', updateStreak);

export default router;
