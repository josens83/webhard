import { Router, Request, Response } from 'express';
import { abTestingService, EduVaultExperiments } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/ab-testing/assign:
 *   post:
 *     summary: Assign user to experiment variant
 *     tags: [A/B Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               experimentId:
 *                 type: string
 *                 example: pricing_test
 *     responses:
 *       200:
 *         description: User assigned to variant
 */
router.post('/assign', authenticate, async (req: Request, res: Response) => {
  try {
    const { experimentId } = req.body;
    const userId = (req as any).user.id;

    if (!experimentId) {
      return res.status(400).json({ error: 'Experiment ID is required' });
    }

    const variant = abTestingService.assignUser(experimentId, userId);

    if (!variant) {
      return res.status(404).json({ error: 'Experiment not found or not running' });
    }

    res.json({
      experimentId,
      variant: {
        id: variant.id,
        name: variant.name,
        config: variant.config,
      },
    });
  } catch (error) {
    console.error('A/B testing assignment error:', error);
    res.status(500).json({ error: 'Failed to assign variant' });
  }
});

/**
 * @swagger
 * /api/ab-testing/convert:
 *   post:
 *     summary: Track conversion event for experiment
 *     tags: [A/B Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               experimentId:
 *                 type: string
 *                 example: pricing_test
 *               metric:
 *                 type: string
 *                 example: payment_completed
 *               value:
 *                 type: number
 *                 example: 9.99
 *     responses:
 *       200:
 *         description: Conversion tracked
 */
router.post('/convert', authenticate, async (req: Request, res: Response) => {
  try {
    const { experimentId, metric, value } = req.body;
    const userId = (req as any).user.id;

    if (!experimentId || !metric) {
      return res.status(400).json({ error: 'Experiment ID and metric are required' });
    }

    abTestingService.trackConversion(experimentId, userId, metric, value);

    res.json({ success: true, message: 'Conversion tracked' });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

/**
 * @swagger
 * /api/ab-testing/results/{experimentId}:
 *   get:
 *     summary: Get experiment results
 *     tags: [A/B Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: experimentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experiment results retrieved
 */
router.get('/results/:experimentId', authenticate, async (req: Request, res: Response) => {
  try {
    const { experimentId } = req.params;

    const results = abTestingService.getResults(experimentId);

    if (!results) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json(results);
  } catch (error) {
    console.error('Results retrieval error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

/**
 * @swagger
 * /api/ab-testing/experiments:
 *   get:
 *     summary: List all available experiments
 *     tags: [A/B Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of experiments
 */
router.get('/experiments', authenticate, async (req: Request, res: Response) => {
  try {
    // Return pre-configured EduVault experiments
    res.json({
      experiments: Object.entries(EduVaultExperiments).map(([id, config]) => ({
        id,
        name: config.name,
        variants: config.variants,
        description: config.description,
      })),
    });
  } catch (error) {
    console.error('Experiments list error:', error);
    res.status(500).json({ error: 'Failed to list experiments' });
  }
});

/**
 * @swagger
 * /api/ab-testing/init-experiments:
 *   post:
 *     summary: Initialize EduVault experiments (admin only)
 *     tags: [A/B Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Experiments initialized
 */
router.post('/init-experiments', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (implement your admin check)
    // For now, we'll initialize experiments

    // Initialize pricing test
    abTestingService.createExperiment({
      id: 'pricing_test',
      name: EduVaultExperiments.pricing.name,
      description: EduVaultExperiments.pricing.description || 'Test optimal pricing',
      variants: EduVaultExperiments.pricing.variants.map((v, idx) => ({
        id: `variant_${idx}`,
        name: v.name,
        allocation: v.allocation,
        config: v.config,
      })),
      successMetrics: EduVaultExperiments.pricing.successMetrics,
      startDate: new Date(),
    });

    // Initialize onboarding test
    abTestingService.createExperiment({
      id: 'onboarding_test',
      name: EduVaultExperiments.onboarding.name,
      description: EduVaultExperiments.onboarding.description || 'Test onboarding flow',
      variants: EduVaultExperiments.onboarding.variants.map((v, idx) => ({
        id: `variant_${idx}`,
        name: v.name,
        allocation: v.allocation,
        config: v.config,
      })),
      successMetrics: EduVaultExperiments.onboarding.successMetrics,
      startDate: new Date(),
    });

    // Initialize trial test
    abTestingService.createExperiment({
      id: 'trial_test',
      name: EduVaultExperiments.trial.name,
      description: EduVaultExperiments.trial.description || 'Test trial length',
      variants: EduVaultExperiments.trial.variants.map((v, idx) => ({
        id: `variant_${idx}`,
        name: v.name,
        allocation: v.allocation,
        config: v.config,
      })),
      successMetrics: EduVaultExperiments.trial.successMetrics,
      startDate: new Date(),
    });

    res.json({ success: true, message: 'Experiments initialized' });
  } catch (error) {
    console.error('Experiment initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize experiments' });
  }
});

export default router;
