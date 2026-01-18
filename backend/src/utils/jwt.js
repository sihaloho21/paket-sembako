import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { logger } from './logger.js';

export const jwtUtils = {
    /**
     * Generate JWT token
     * @param {object} payload - Data to encode in token
     * @param {string} expiresIn - Token expiration (default: 24h)
     * @returns {string} JWT token
     */
    generateToken(payload, expiresIn = '24h') {
        try {
            return jwt.sign(payload, config.jwtSecret, { expiresIn });
        } catch (error) {
            logger.error('Error generating JWT token:', error);
            throw new Error('Failed to generate token');
        }
    },
    
    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @returns {object} Decoded payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, config.jwtSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw error;
        }
    },
    
    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} Token or null
     */
    extractToken(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
};
