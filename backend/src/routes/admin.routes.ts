import express from 'express';
import {
  reviewFile,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  createBanner,
  getBanners,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/files/:id/review', reviewFile);
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.post('/banners', createBanner);
router.get('/banners', getBanners);

export default router;
