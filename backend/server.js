const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const replyRoutes = require('./routes/reply.routes');
const reviewRoutes = require('./routes/review.routes');
const googleRoutes = require('./routes/google.routes');
const profileRoutes = require('./routes/profile.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const billingRoutes = require('./routes/billing.routes');
const aiConfigRoutes = require('./routes/aiConfig.routes');
const integrationRoutes = require('./routes/integration.routes');
const insightsRoutes = require('./routes/insights.routes');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const { generalLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');
const { getHealth, getQueueMetrics } = require('./controllers/health.controller');
const { sendTestEmail, getEmailStatus } = require('./controllers/test.controller');
const { validateEmailConfig } = require('./config/emailValidator');
const { handleWebhook, syncAllSubscriptions } = require('./controllers/webhook.controller');
const authMiddleware = require('./middleware/auth.middleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize cron jobs
require('./cron/resetUsage');
require('./cron/queueMetrics');

// Import workers (they self-initialize)
require('./workers/reviewFetcher');
require('./workers/aiWorker');
require('./workers/emailWorker');
require('./workers/googleReviewFetcher');
require('./workers/insightWorker');

// Validate email configuration at startup
validateEmailConfig();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Stripe webhook - must be before regular JSON parsing for signature verification
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Expose static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply global rate limiting
app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    method: req.method,
    path: req.path
  });
  next();
});

// Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reply', aiLimiter, replyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/insights', insightsRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ReplyCraft AI Backend',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Detailed health check with database, redis, queue status
app.get('/api/health', getHealth);

// Queue metrics endpoint
app.get('/api/health/queue', getQueueMetrics);

// Test endpoints (protected)
app.post('/api/test/email', authMiddleware, sendTestEmail);
app.get('/api/test/email/status', authMiddleware, getEmailStatus);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ReplyCraft AI Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      generateReply: 'POST /api/reply/generate-reply',
      processReview: 'POST /api/reviews/process'
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Endpoint not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');
    
    // Sync subscriptions on startup (downgrade expired plans)
    await syncAllSubscriptions();
    
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`ReplyCraft AI Backend running on port ${PORT}`);
      logger.info('Available endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/reply/generate-reply, POST /api/reviews/process, GET /health');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    process.exit(1);
  }
};

startServer();

module.exports = app;
