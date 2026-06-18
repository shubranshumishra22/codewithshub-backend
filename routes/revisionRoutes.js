import { Router } from 'express';
import {
  completeRevision,
  getTodayRevision,
  getUpcomingRevision,
  uncompleteRevision,
} from '../controllers/revisionController.js';

const router = Router();

router.get('/today', getTodayRevision);
router.get('/upcoming', getUpcomingRevision);
router.post('/complete', completeRevision);
router.post('/uncomplete', uncompleteRevision);

export default router;
