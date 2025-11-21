import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getFiles,
  getFileById,
  uploadFile,
  downloadFile,
  purchaseFile,
  toggleFavorite,
} from '../controllers/file.controller';
import { authenticate, requireSeller } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10737418240'), // 10GB
  },
});

router.get('/', getFiles);
router.get('/:id', getFileById);
router.post('/upload', authenticate, requireSeller, upload.single('file'), uploadFile);
router.post('/:id/download', authenticate, downloadFile);
router.post('/:id/purchase', authenticate, purchaseFile);
router.post('/:id/favorite', authenticate, toggleFavorite);

export default router;
