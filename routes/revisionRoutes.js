import { Router } from 'express';
import {
  completeRevision,
  getTodayRevision,
  getUpcomingRevision,
} from '../controllers/revisionController.js';

const router = Router();

router.get('/today', getTodayRevision);
router.get('/upcoming', getUpcomingRevision);
router.post('/complete', completeRevision);

export default router;
