/**
 * API Service Wrapper (Backend Version)
 * Updated to work with secure backend API Gateway
 * Provides caching, retry logic, error handling, and JWT authentication
 */

import { CONFIG } from './config-backend.js';
import { logger } from './logger.js';

export const ApiService = {
    // Cache storage
    cache: new Map(),
    
    // Pending requests to prevent duplicates
    pendingRequests: new Map(),
    
    // Default cache duration (5 minutes)
    DEFAULT_CACHE_DURATION: 5 * 60 * 1000,
    
    // Default retry configuration
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY: 1000, // 1 second
    
    /**
     * Get authorization headers
     * @private
     */
    _getAuthHeaders() {
        const token = CONFIG.getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    /**
     * Main fetch method with caching and retry logic
     * @param {string} endpoint - API endpoint (e.g., '?sheet=products')
     * @param {object} options - Fetch options
     * @param {boolean} options.cache - Enable caching (default: true)
     * @param {number} options.cacheDuration - Cache duration in ms (default: 5 minutes)
     * @param {number} options.maxRetries - Max retry attempts (default: 3)
     * @param {boolean} options.requireAuth - Require authentication (default: false)
     * @returns {Promise} Response data
     */
    async fetch(endpoint, options = {}) {
        const url = `${CONFIG.getMainApiUrl()}${endpoint}`;
        const cacheKey = this._generateCacheKey(url, options);
        
        // Check if caching is enabled (default: true)
        const cacheEnabled = options.cache !== false;
        
        // Check cache first
        if (cacheEnabled && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            const cacheDuration = options.cacheDuration || this.DEFAULT_CACHE_DURATION;
            
            if (Date.now() - cached.timestamp < cacheDuration) {
                logger.log('📦 [ApiService] Using cached data:', endpoint);
                return cached.data;
            } else {
                // Cache expired, remove it
                logger.log('⏰ [ApiService] Cache expired:', endpoint);
                this.cache.delete(cacheKey);
            }
        }
        
        // Check if there's already a pending request for this endpoint
        if (this.pendingRequests.has(cacheKey)) {
            logger.log('⏳ [ApiService] Waiting for pending request:', endpoint);
            return this.pendingRequests.get(cacheKey);
        }
        
        // Create new request with retry logic
        const requestPromise = this._fetchWithRetry(url, options);
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const response = await requestPromise;
            
            // Backend returns {success, data} format
            const data = response.data || response;
            
            // Cache the result if caching is enabled
            if (cacheEnabled) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
                logger.log('💾 [ApiService] Data cached:', endpoint);
            }
            
            return data;
        } catch (error) {
            logger.error('❌ [ApiService] Request failed:', endpoint, error);
            throw error;
        } finally {
            // Remove from pending requests
            this.pendingRequests.delete(cacheKey);
        }
    },
    
    /**
     * Fetch with retry logic and exponential backoff
     * @private
     */
    async _fetchWithRetry(url, options) {
        const maxRetries = options.maxRetries || this.MAX_RETRIES;
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                logger.log(`🌐 [ApiService] Request attempt ${attempt + 1}/${maxRetries}:`, url);
                
                const fetchOptions = {
                    method: options.method || 'GET',
                    mode: 'cors',
                    headers: {
                        ...this._getAuthHeaders(),
                        ...options.headers
                    }
                };
                
                if (options.body) {
                    fetchOptions.body = typeof options.body === 'string' 
                        ? options.body 
                        : JSON.stringify(options.body);
                }
                
                const response = await fetch(url, fetchOptions);
                
                // Handle rate limit (429)
                if (response.status === 429) {
                    if (attempt < maxRetries - 1) {
                        const waitTime = this._calculateBackoff(attempt);
                        logger.warn(`⏱️ [ApiService] Rate limited (429), retrying in ${waitTime}ms...`);
                        await this._sleep(waitTime);
                        continue;
                    } else {
                        throw new Error('Rate limit exceeded. Please try again later.');
                    }
                }
                
                // Handle authentication errors
                if (response.status === 401) {
                    logger.warn('Authentication failed, clearing auth data');
                    CONFIG.clearAuth();
                    throw new Error('Authentication required. Please login again.');
                }
                
                // Handle other HTTP errors
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Success
                const data = await response.json();
                logger.log('✅ [ApiService] Request successful:', url);
                return data;
                
            } catch (error) {
                lastError = error;
                
                // If it's a network error and we have retries left, try again
                if (attempt < maxRetries - 1 && this._isRetryableError(error)) {
                    const waitTime = this._calculateBackoff(attempt);
                    logger.warn(`🔄 [ApiService] Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms:`, error.message);
                    await this._sleep(waitTime);
                    continue;
                }
                
                // No more retries, throw error
                break;
            }
        }
        
        throw lastError;
    },
    
    /**
     * Calculate exponential backoff delay
     * @private
     */
    _calculateBackoff(attempt) {
        // Exponential backoff: 1s, 2s, 4s, 8s, ...
        return this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
    },
    
    /**
     * Check if error is retryable
     * @private
     */
    _isRetryableError(error) {
        // Retry on network errors, timeouts, etc.
        return error.message.includes('fetch') || 
               error.message.includes('network') ||
               error.message.includes('timeout');
    },
    
    /**
     * Sleep utility
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Generate cache key from URL and options
     * @private
     */
    _generateCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body || '';
        return `${method}:${url}:${body}`;
    },
    
    /**
     * Clear all cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        logger.log(`🗑️ [ApiService] Cache cleared: ${size} entries removed`);
        return size;
    },
    
    /**
     * Clear cache for specific endpoint
     */
    clearCacheForEndpoint(endpoint) {
        const url = `${CONFIG.getMainApiUrl()}${endpoint}`;
        let cleared = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (key.includes(url)) {
                this.cache.delete(key);
                cleared++;
            }
        }
        
        logger.log(`🗑️ [ApiService] Cache cleared for ${endpoint}: ${cleared} entries`);
        return cleared;
    },
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        const stats = {
            totalEntries: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            entries: []
        };
        
        for (const [key, value] of this.cache.entries()) {
            const age = Date.now() - value.timestamp;
            stats.entries.push({
                key,
                age: Math.round(age / 1000), // in seconds
                size: JSON.stringify(value.data).length
            });
        }
        
        return stats;
    },
    
    /**
     * POST request helper
     */
    async post(endpoint, data, options = {}) {
        return this.fetch(endpoint, {
            ...options,
            method: 'POST',
            body: data,
            cache: false, // Don't cache POST requests by default
            requireAuth: options.requireAuth !== false // Require auth by default for POST
        });
    },
    
    /**
     * PATCH request helper
     */
    async patch(endpoint, data, options = {}) {
        return this.fetch(endpoint, {
            ...options,
            method: 'PATCH',
            body: data,
            cache: false, // Don't cache PATCH requests by default
            requireAuth: options.requireAuth !== false // Require auth by default for PATCH
        });
    },
    
    /**
     * DELETE request helper
     */
    async delete(endpoint, options = {}) {
        return this.fetch(endpoint, {
            ...options,
            method: 'DELETE',
            cache: false, // Don't cache DELETE requests by default
            requireAuth: options.requireAuth !== false // Require auth by default for DELETE
        });
    },
    
    /**
     * GET request helper (with caching)
     */
    async get(endpoint, options = {}) {
        return this.fetch(endpoint, {
            ...options,
            method: 'GET'
        });
    },
    
    /**
     * Login to backend
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise} Login response
     */
    async login(username, password) {
        try {
            const response = await fetch(`${CONFIG.getBackendUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Login failed');
            }
            
            const data = await response.json();
            
            if (data.success && data.data.token) {
                CONFIG.setAuthToken(data.data.token);
                CONFIG.setUserData(data.data.user);
                logger.info('Login successful');
            }
            
            return data;
            
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    },
    
    /**
     * Logout from backend
     */
    async logout() {
        try {
            await fetch(`${CONFIG.getBackendUrl()}/auth/logout`, {
                method: 'POST',
                headers: this._getAuthHeaders()
            });
        } catch (error) {
            logger.error('Logout error:', error);
        } finally {
            CONFIG.clearAuth();
            this.clearCache();
            logger.info('Logged out');
        }
    }
};
