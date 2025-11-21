import express from 'express';
import {
  getUserProfile,
  updateProfile,
  getMyFiles,
  getMyPurchases,
  getMyFavorites,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/profile/:id', getUserProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/my-files', authenticate, getMyFiles);
router.get('/my-purchases', authenticate, getMyPurchases);
router.get('/my-favorites', authenticate, getMyFavorites);

export default router;
