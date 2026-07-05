import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/upload.js';
import { uploadResumeFile, analyzeResumeHandler, optimizeResumeHandler, downloadResume, chatResumeHandler } from '../controllers/resumeController.js';

const router = Router();

router.post('/upload', authMiddleware, uploadResume, uploadResumeFile);
router.post('/analyze', authMiddleware, analyzeResumeHandler);
router.post('/optimize', authMiddleware, optimizeResumeHandler);
router.post('/chat', authMiddleware, chatResumeHandler);
router.post('/download', authMiddleware, downloadResume);

export default router;
