import { Router } from 'express';
import { getSettings, updateSettings, updateStreak, getLeaderboard } from '../controllers/userController.js';

const router = Router();

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/streak/update', updateStreak);
router.get('/leaderboard', getLeaderboard);

export default router;
