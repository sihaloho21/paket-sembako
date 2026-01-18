import NodeCache from 'node-cache';
import { config } from './config.js';
import { logger } from './logger.js';

// Create cache instance with default TTL from config
const cache = new NodeCache({
    stdTTL: config.cacheDuration,
    checkperiod: 60, // Check for expired keys every 60 seconds
    useClones: false // Don't clone objects (better performance)
});

export const cacheUtils = {
    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null
     */
    get(key) {
        try {
            const value = cache.get(key);
            if (value !== undefined) {
                logger.debug(`Cache HIT: ${key}`);
                return value;
            }
            logger.debug(`Cache MISS: ${key}`);
            return null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    },
    
    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (optional)
     * @returns {boolean} Success status
     */
    set(key, value, ttl = null) {
        try {
            const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
            if (success) {
                logger.debug(`Cache SET: ${key} (TTL: ${ttl || config.cacheDuration}s)`);
            }
            return success;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    },
    
    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {number} Number of deleted entries
     */
    del(key) {
        try {
            const deleted = cache.del(key);
            logger.debug(`Cache DEL: ${key} (${deleted} entries)`);
            return deleted;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return 0;
        }
    },
    
    /**
     * Clear all cache
     */
    flush() {
        try {
            cache.flushAll();
            logger.info('Cache flushed');
        } catch (error) {
            logger.error('Cache flush error:', error);
        }
    },
    
    /**
     * Get cache statistics
     * @returns {object} Cache stats
     */
    getStats() {
        return cache.getStats();
    },
    
    /**
     * Generate cache key for SheetDB requests
     * @param {string} sheet - Sheet name
     * @param {object} params - Query parameters
     * @returns {string} Cache key
     */
    generateKey(sheet, params = {}) {
        const paramStr = Object.keys(params)
            .sort()
            .map(k => `${k}=${params[k]}`)
            .join('&');
        return `sheetdb:${sheet}:${paramStr}`;
    }
};
