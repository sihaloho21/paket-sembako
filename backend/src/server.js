import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import sheetdbRoutes from './routes/sheetdb.js';

// Validate configuration
try {
    config.validate();
    logger.info('Configuration validated successfully');
} catch (error) {
    logger.error('Configuration validation failed:', error.message);
    process.exit(1);
}

// Create Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Paket Sembako API Gateway is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sheetdb', sheetdbRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`🚀 Paket Sembako API Gateway started`);
    logger.info(`📡 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
