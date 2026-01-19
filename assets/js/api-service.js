/**
 * API Service untuk Google Apps Script
 * Menggantikan api-service.js yang menggunakan SheetDB
 * 
 * Fitur:
 * - Full CRUD operations
 * - Client-side caching
 * - Request deduplication
 * - Retry logic dengan exponential backoff
 * - Error handling yang konsisten
 */

import { CONFIG } from './config.js';
import { logger } from './logger.js';

class ApiServiceGAS {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.cacheConfig = {
            products: 300000,      // 5 menit
            orders: 60000,         // 1 menit
            customers: 120000,     // 2 menit
            rewards: 300000,       // 5 menit
            default: 180000        // 3 menit
        };
    }

    /**
     * GET Request - Membaca data dari sheet
     * @param {string} sheetName - Nama sheet (products, orders, customers, rewards)
     * @param {object} options - Optional parameters
     * @returns {Promise<Array>}
     */
    async getData(sheetName, options = {}) {
        const { forceRefresh = false, searchParams = null } = options;
        
        // Buat cache key
        const cacheKey = searchParams 
            ? `${sheetName}_search_${JSON.stringify(searchParams)}`
            : `${sheetName}_all`;

        // Cek cache jika tidak force refresh
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.getCacheDuration(sheetName)) {
                logger.log(`[ApiServiceGAS] Cache hit: ${cacheKey}`);
                return cached.data;
            }
        }

        // Cek apakah ada request yang sama sedang berjalan
        if (this.pendingRequests.has(cacheKey)) {
            logger.log(`[ApiServiceGAS] Reusing pending request: ${cacheKey}`);
            return this.pendingRequests.get(cacheKey);
        }

        // Buat request baru
        const requestPromise = this._executeGetRequest(sheetName, searchParams);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const data = await requestPromise;
            
            // Simpan ke cache
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * POST Request - Create data baru
     * @param {string} sheetName - Nama sheet
     * @param {object|array} data - Data yang akan ditambahkan
     * @returns {Promise<object>}
     */
    async createData(sheetName, data) {
        const payload = {
            action: 'create',
            sheetName: sheetName,
            data: data,
            secretKey: CONFIG.get('API_SECRET_KEY')
        };

        const result = await this._executePostRequest(payload);
        
        // Invalidate cache setelah create
        this.invalidateCache(sheetName);
        
        return result;
    }

    /**
     * POST Request - Update data yang ada
     * @param {string} sheetName - Nama sheet
     * @param {object} condition - Kondisi untuk mencari data (contoh: { id: '123' })
     * @param {object} newData - Data baru untuk update
     * @returns {Promise<object>}
     */
    async updateData(sheetName, condition, newData) {
        const payload = {
            action: 'update',
            sheetName: sheetName,
            condition: condition,
            data: newData,
            secretKey: CONFIG.get('API_SECRET_KEY')
        };

        const result = await this._executePostRequest(payload);
        
        // Invalidate cache setelah update
        this.invalidateCache(sheetName);
        
        return result;
    }

    /**
     * POST Request - Delete data
     * @param {string} sheetName - Nama sheet
     * @param {object} condition - Kondisi untuk mencari data yang akan dihapus
     * @returns {Promise<object>}
     */
    async deleteData(sheetName, condition) {
        const payload = {
            action: 'delete',
            sheetName: sheetName,
            condition: condition,
            secretKey: CONFIG.get('API_SECRET_KEY')
        };

        const result = await this._executePostRequest(payload);
        
        // Invalidate cache setelah delete
        this.invalidateCache(sheetName);
        
        return result;
    }

    /**
     * Search data dengan kriteria tertentu
     * @param {string} sheetName - Nama sheet
     * @param {object} searchParams - Parameter pencarian (contoh: { kategori: 'sembako' })
     * @returns {Promise<Array>}
     */
    async searchData(sheetName, searchParams) {
        return this.getData(sheetName, { searchParams });
    }

    // --- PRIVATE METHODS --- //

    /**
     * Execute GET request ke Google Apps Script
     */
    async _executeGetRequest(sheetName, searchParams = null) {
        const baseUrl = CONFIG.get('MAIN_API');
        const params = new URLSearchParams({
            action: searchParams ? 'search' : 'read',
            sheet: sheetName
        });

        // Tambahkan search params jika ada
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                params.append(key, value);
            });
        }

        const url = `${baseUrl}?${params.toString()}`;

        logger.log(`[ApiServiceGAS] GET Request: ${url}`);

        const response = await this._fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Request failed');
        }

        return result.data;
    }

    /**
     * Execute POST request ke Google Apps Script
     */
    async _executePostRequest(payload) {
        const url = CONFIG.get('ADMIN_API');

        logger.log(`[ApiServiceGAS] POST Request: ${payload.action} on ${payload.sheetName}`);

        const response = await this._fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Request failed');
        }

        return result;
    }

    /**
     * Fetch dengan retry logic (exponential backoff)
     */
    async _fetchWithRetry(url, options, maxRetries = 3) {
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                lastError = error;
                logger.error(`[ApiServiceGAS] Request failed (attempt ${i + 1}/${maxRetries}):`, error);

                // Jangan retry jika error 4xx (client error)
                if (error.message.includes('HTTP 4')) {
                    throw error;
                }

                // Tunggu sebelum retry (exponential backoff)
                if (i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Get cache duration untuk sheet tertentu
     */
    getCacheDuration(sheetName) {
        return this.cacheConfig[sheetName] || this.cacheConfig.default;
    }

    /**
     * Invalidate cache untuk sheet tertentu
     */
    invalidateCache(sheetName) {
        const keysToDelete = [];
        
        for (const [key] of this.cache) {
            if (key.startsWith(sheetName)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            logger.log(`[ApiServiceGAS] Cache invalidated: ${key}`);
        });
    }

    /**
     * Clear semua cache
     */
    clearAllCache() {
        this.cache.clear();
        logger.log('[ApiServiceGAS] All cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // ============ BACKWARD COMPATIBILITY METHODS ============
    
    /**
     * Backward compatibility: .get() method
     * Parses query string and calls appropriate method
     * @param {string} endpoint - Query string like "?sheet=products"
     * @param {object} options - Options including cacheDuration
     * @returns {Promise<Array>}
     */
    async get(endpoint, options = {}) {
        // Parse the endpoint to extract sheet name
        const params = new URLSearchParams(endpoint);
        const sheetName = params.get('sheet');
        
        if (!sheetName) {
            logger.error('[ApiServiceGAS] Panggilan .get() tidak menyertakan parameter ?sheet=');
            return Promise.reject(new Error('Parameter sheet tidak ditemukan'));
        }
        
        // Convert cacheDuration option to forceRefresh
        const forceRefresh = options.cache === false;
        
        return this.getData(sheetName, { 
            forceRefresh,
            ...options 
        });
    }

    /**
     * Backward compatibility: .post() method
     * @param {string} endpoint - Query string like "?sheet=orders"
     * @param {object|array} data - Data to create
     * @returns {Promise<object>}
     */
    async post(endpoint, data) {
        const params = new URLSearchParams(endpoint);
        const sheetName = params.get('sheet');
        
        if (!sheetName) {
            logger.error('[ApiServiceGAS] Panggilan .post() tidak menyertakan parameter ?sheet=');
            return Promise.reject(new Error('Parameter sheet tidak ditemukan'));
        }
        
        return this.createData(sheetName, data);
    }

    /**
     * Backward compatibility: .put() method
     * @param {string} endpoint - Query string with ID
     * @param {object} data - Data to update
     * @returns {Promise<object>}
     */
    async put(endpoint, data) {
        const params = new URLSearchParams(endpoint);
        const sheetName = params.get('sheet');
        const idMatch = endpoint.match(/\/id\/([^?]+)/);
        const id = idMatch ? idMatch[1] : null;
        
        if (!sheetName || !id) {
            logger.error('[ApiServiceGAS] Panggilan .put() memerlukan ?sheet= dan /id/');
            return Promise.reject(new Error('Parameter sheet atau id tidak ditemukan'));
        }
        
        return this.updateData(sheetName, { id }, data);
    }

    /**
     * Backward compatibility: .delete() method
     * @param {string} endpoint - Query string with ID
     * @returns {Promise<object>}
     */
    async delete(endpoint) {
        const params = new URLSearchParams(endpoint);
        const sheetName = params.get('sheet');
        const idMatch = endpoint.match(/\/id\/([^?]+)/);
        const id = idMatch ? idMatch[1] : null;
        
        if (!sheetName || !id) {
            logger.error('[ApiServiceGAS] Panggilan .delete() memerlukan ?sheet= dan /id/');
            return Promise.reject(new Error('Parameter sheet atau id tidak ditemukan'));
        }
        
        return this.deleteData(sheetName, { id });
    }
}

// Export singleton instance
export const ApiService = new ApiServiceGAS();

// Expose ke window untuk backward compatibility
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}
