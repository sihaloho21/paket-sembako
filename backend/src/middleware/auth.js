import { jwtUtils } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = jwtUtils.extractToken(authHeader);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        
        const decoded = jwtUtils.verifyToken(token);
        req.user = decoded;
        next();
        
    } catch (error) {
        logger.error('Authentication error:', error.message);
        
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(403).json({
            success: false,
            message: 'Invalid or malformed token'
        });
    }
};

/**
 * Middleware to verify admin role
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};
