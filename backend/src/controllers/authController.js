import { config } from '../utils/config.js';
import { jwtUtils } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export const authController = {
    /**
     * Admin login
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validate input
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }
            
            // Verify credentials
            if (username !== config.adminUsername || password !== config.adminPassword) {
                logger.warn('Failed login attempt for username:', username);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }
            
            // Generate JWT token
            const token = jwtUtils.generateToken({
                username: username,
                role: 'admin'
            }, '24h');
            
            logger.info('Successful login for admin:', username);
            
            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        username,
                        role: 'admin'
                    }
                }
            });
            
        } catch (error) {
            logger.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    
    /**
     * Verify token
     * GET /api/auth/verify
     */
    async verify(req, res) {
        try {
            // Token already verified by middleware
            return res.json({
                success: true,
                message: 'Token is valid',
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            logger.error('Verify error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    
    /**
     * Logout (client-side token removal)
     * POST /api/auth/logout
     */
    async logout(req, res) {
        try {
            logger.info('User logged out:', req.user?.username);
            return res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            logger.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
