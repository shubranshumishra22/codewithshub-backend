import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import progressRoutes from './progressRoutes.js';
import revisionRoutes from './revisionRoutes.js';
import sheetRoutes from './sheetRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/sheets', sheetRoutes);
router.use('/progress', authMiddleware, progressRoutes);
router.use('/revision', authMiddleware, revisionRoutes);
router.use('/user', authMiddleware, userRoutes);

export default router;
