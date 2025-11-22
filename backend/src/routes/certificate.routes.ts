import { Router } from 'express';
import certificateService from '../services/certificate.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/certificates/issue
 * @desc    Issue certificate for completed course
 * @access  Private
 */
router.post('/issue', authenticate, async (req, res) => {
  try {
    const { courseId, finalGrade } = req.body;

    const certificate = await certificateService.issueCertificate({
      userId: req.user.id,
      courseId,
      finalGrade,
    });

    res.status(201).json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/certificates/verify/:code
 * @desc    Verify certificate by verification code
 * @access  Public
 */
router.get('/verify/:code', async (req, res) => {
  try {
    const result = await certificateService.verifyCertificate(req.params.code);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/certificates/my
 * @desc    Get user's certificates
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const certificates = await certificateService.getUserCertificates(req.user.id);

    res.json({
      success: true,
      data: certificates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/certificates/:id/blockchain
 * @desc    Add blockchain hash to certificate
 * @access  Private (Admin)
 */
router.post('/:id/blockchain', authenticate, async (req, res) => {
  try {
    const { blockchainHash, transactionHash } = req.body;

    const certificate = await certificateService.addBlockchainHash(
      req.params.id,
      blockchainHash,
      transactionHash
    );

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
