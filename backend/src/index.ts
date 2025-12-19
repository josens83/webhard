import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { initializeSocket } from './services/socket.service';

// World-class Optimization Services
import { PerformanceMonitoringService, performanceMiddleware } from './services/performance-monitoring.service';
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService, EduVaultExperiments } from './services/ab-testing.service';
import { FreemiumOptimizationService } from './services/freemium-optimization.service';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import fileRoutes from './routes/file.routes';
import categoryRoutes from './routes/category.routes';
import paymentRoutes from './routes/payment.routes';
import commentRoutes from './routes/comment.routes';
import adminRoutes from './routes/admin.routes';

// Educational Platform Routes
import courseRoutes from './routes/course.routes';
import aiLearningRoutes from './routes/ai-learning.routes';
import certificateRoutes from './routes/certificate.routes';
import copyrightRoutes from './routes/copyright.routes';

// World-class Optimization Routes
import analyticsRoutes from './routes/analytics.routes';
import abTestingRoutes from './routes/ab-testing.routes';

// Chat Routes
import chatRoutes from './routes/chat.routes';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Initialize world-class optimization services
const performanceMonitor = new PerformanceMonitoringService();
const analyticsService = new AnalyticsService();
const abTestingService = new ABTestingService();
const freemiumService = new FreemiumOptimizationService();

// Export for use in routes
export { performanceMonitor, analyticsService, abTestingService, freemiumService, EduVaultExperiments, io, httpServer };

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduVault API',
      version: '2.0.0',
      description: 'Educational Content Platform API - AI-powered learning, blockchain copyright, and course management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.eduvault.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('combined'));

// Performance monitoring (Netflix/Linear-inspired)
app.use(performanceMiddleware(performanceMonitor));

// Rate limiting
app.use('/api/', rateLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Educational Platform Routes
app.use('/api/courses', courseRoutes);
app.use('/api/ai-learning', aiLearningRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/copyright', copyrightRoutes);

// World-class Optimization Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ab-testing', abTestingRoutes);

// Chat Routes
app.use('/api/chat', chatRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server with Socket.io
httpServer.listen(PORT, () => {
  console.log(`\n🎓 EduVault Educational Platform`);
  console.log(`================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io: Enabled`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`\n🎯 Educational Features:`);
  console.log(`   📖 Courses: /api/courses`);
  console.log(`   🤖 AI Learning: /api/ai-learning`);
  console.log(`   🏆 Certificates: /api/certificates`);
  console.log(`   🔐 Copyright: /api/copyright`);
  console.log(`\n⚡ World-class Optimizations:`);
  console.log(`   📊 Analytics: /api/analytics`);
  console.log(`   🧪 A/B Testing: /api/ab-testing`);
  console.log(`   ⚡ Performance Monitoring: Active`);
  console.log(`\n💬 Communication:`);
  console.log(`   💬 Chat: /api/chat`);
  console.log(`================================\n`);
});

export default app;
