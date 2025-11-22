import { Router } from 'express';
import blockchainCopyrightService from '../services/blockchain-copyright.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/copyright/register
 * @desc    Register copyright for educational content
 * @access  Private (Teachers/Creators)
 */
router.post('/register', authenticate, async (req, res) => {
  try {
    const { fileId, title, description, licenseType, content } = req.body;

    const copyrightRecord = await blockchainCopyrightService.registerCopyright({
      ownerId: req.user.id,
      fileId,
      title,
      description,
      licenseType,
      content: content ? Buffer.from(content, 'base64') : undefined,
    });

    res.status(201).json({
      success: true,
      data: copyrightRecord,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/copyright/verify/:tokenId
 * @desc    Verify copyright on blockchain
 * @access  Public
 */
router.get('/verify/:tokenId', async (req, res) => {
  try {
    const result = await blockchainCopyrightService.verifyCopyrightOnChain(req.params.tokenId);

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
 * @route   GET /api/copyright/file/:fileId
 * @desc    Get copyright record by file ID
 * @access  Public
 */
router.get('/file/:fileId', async (req, res) => {
  try {
    const copyrightRecord = await blockchainCopyrightService.getCopyrightByFileId(req.params.fileId);

    if (!copyrightRecord) {
      return res.status(404).json({
        success: false,
        message: 'Copyright record not found',
      });
    }

    res.json({
      success: true,
      data: copyrightRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/copyright/my
 * @desc    Get user's copyright records
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const copyrights = await blockchainCopyrightService.getUserCopyrights(req.user.id);

    res.json({
      success: true,
      data: copyrights,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/copyright/:id/nft
 * @desc    Create NFT for educational content
 * @access  Private (Content owner)
 */
router.post('/:id/nft', authenticate, async (req, res) => {
  try {
    const { metadataUrl } = req.body;

    const updated = await blockchainCopyrightService.createContentNFT(req.params.id, metadataUrl);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/copyright/check-originality
 * @desc    Check content originality
 * @access  Private (Teachers/Creators)
 */
router.post('/check-originality', authenticate, async (req, res) => {
  try {
    const { content, title } = req.body;

    const result = await blockchainCopyrightService.checkOriginality(content, title);

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

export default router;
