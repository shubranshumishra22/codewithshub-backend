import { Router } from 'express';
import {
  completeRevision,
  getTodayRevision,
  getUpcomingRevision,
  syncQuestionRevision,
  uncompleteRevision,
} from '../controllers/revisionController.js';

const router = Router();

router.get('/today', getTodayRevision);
router.get('/upcoming', getUpcomingRevision);
router.post('/complete', completeRevision);
router.post('/uncomplete', uncompleteRevision);
router.post('/sync-question', syncQuestionRevision);

export default router;
