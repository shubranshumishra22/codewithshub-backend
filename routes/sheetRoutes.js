import { Router } from 'express';
import { getSheets, getTopicsWithQuestions } from '../controllers/sheetsController.js';

const router = Router();

router.get('/', getSheets);
router.get('/:id/topics', getTopicsWithQuestions);

export default router;
