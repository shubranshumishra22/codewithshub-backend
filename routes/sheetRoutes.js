import { Router } from 'express';
import {
  getSheets,
  getTopicsWithQuestions,
  getQuestionBySlug,
  getCompanySheets,
  getCompanySheetDetails,
  syncCompanySheetDetails
} from '../controllers/sheetsController.js';

const router = Router();

router.get('/', getSheets);
router.get('/companies', getCompanySheets);
router.get('/companies/:companyName', getCompanySheetDetails);
router.post('/companies/:companyName/sync', syncCompanySheetDetails);
router.get('/:id/topics', getTopicsWithQuestions);
router.get('/questions/by-slug/:slug', getQuestionBySlug);

export default router;
