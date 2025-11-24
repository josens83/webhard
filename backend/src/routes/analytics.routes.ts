import { Router, Request, Response } from 'express';
import { analyticsService } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     summary: Track an analytics event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: course_enrolled
 *               properties:
 *                 type: object
 *                 example: { courseId: "abc123", isFirstCourse: true }
 *     responses:
 *       200:
 *         description: Event tracked successfully
 */
router.post('/track', authenticate, async (req: Request, res: Response) => {
  try {
    const { event, properties = {} } = req.body;
    const userId = (req as any).user.id;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    await analyticsService.trackEvent(userId, event, {
      ...properties,
      platform: req.headers['user-agent'] || 'unknown',
      url: req.headers.referer || 'unknown',
      ip: req.ip,
    });

    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const dashboard = analyticsService.getDashboard(startDate, endDate);

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * @swagger
 * /api/analytics/funnel:
 *   post:
 *     summary: Analyze conversion funnel
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               steps:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["course_viewed", "course_enrolled", "lesson_started", "lesson_completed"]
 *     responses:
 *       200:
 *         description: Funnel analysis completed
 */
router.post('/funnel', authenticate, async (req: Request, res: Response) => {
  try {
    const { steps } = req.body;

    if (!steps || !Array.isArray(steps) || steps.length < 2) {
      return res.status(400).json({ error: 'At least 2 steps are required' });
    }

    const funnel = analyticsService.getFunnelAnalysis(steps);

    res.json(funnel);
  } catch (error) {
    console.error('Funnel analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze funnel' });
  }
});

/**
 * @swagger
 * /api/analytics/cohort-retention:
 *   get:
 *     summary: Get cohort retention analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cohortDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Cohort retention data retrieved
 */
router.get('/cohort-retention', authenticate, async (req: Request, res: Response) => {
  try {
    const cohortDate = req.query.cohortDate ? new Date(req.query.cohortDate as string) : new Date();

    const retention = analyticsService.getCohortRetention(cohortDate);

    res.json(retention);
  } catch (error) {
    console.error('Cohort retention error:', error);
    res.status(500).json({ error: 'Failed to get cohort retention' });
  }
});

export default router;
