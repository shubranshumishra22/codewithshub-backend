import { Router } from 'express';
import { getSheets, getTopicsWithQuestions, getQuestionBySlug } from '../controllers/sheetsController.js';

const router = Router();

router.get('/', getSheets);
router.get('/:id/topics', getTopicsWithQuestions);
router.get('/questions/by-slug/:slug', getQuestionBySlug);

export default router;
