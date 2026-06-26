import { Router } from 'express';
import {
  getProgressBySheet,
  markQuestionSolved,
  unmarkQuestionSolved,
  checkLogic,
} from '../controllers/progressController.js';

const router = Router();

router.get('/:sheetId', getProgressBySheet);
router.post('/', markQuestionSolved);
router.delete('/:questionId', unmarkQuestionSolved);
router.post('/logic-check', checkLogic);

export default router;
