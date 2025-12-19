import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint for deployment platforms
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '2.0.0',
      services: {
        database: 'connected',
        server: 'running',
      },
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'disconnected',
        server: 'running',
      },
      error: errorMessage,
    });
  }
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check - indicates if the app is ready to receive traffic
 * @access  Public
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Liveness check - indicates if the app is alive
 * @access  Public
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
