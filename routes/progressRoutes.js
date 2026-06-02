import { Router } from 'express';
import {
  getProgressBySheet,
  markQuestionSolved,
  unmarkQuestionSolved,
} from '../controllers/progressController.js';

const router = Router();

router.get('/:sheetId', getProgressBySheet);
router.post('/', markQuestionSolved);
router.delete('/:questionId', unmarkQuestionSolved);

export default router;
