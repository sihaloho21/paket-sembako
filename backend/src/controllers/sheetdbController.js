import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { cacheUtils } from '../utils/cache.js';

export const sheetdbController = {
    /**
     * GET data from SheetDB
     * GET /api/sheetdb?sheet=products
     */
    async getData(req, res) {
        try {
            const { sheet, ...queryParams } = req.query;
            
            if (!sheet) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet parameter is required'
                });
            }
            
            // Generate cache key
            const cacheKey = cacheUtils.generateKey(sheet, queryParams);
            
            // Check cache first
            const cached = cacheUtils.get(cacheKey);
            if (cached) {
                return res.json({
                    success: true,
                    data: cached,
                    cached: true
                });
            }
            
            // Build URL
            const queryString = new URLSearchParams(queryParams).toString();
            const url = `${config.sheetdbApiUrl}?sheet=${sheet}${queryString ? '&' + queryString : ''}`;
            
            logger.info('Fetching from SheetDB:', url);
            
            // Fetch from SheetDB
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`SheetDB returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            cacheUtils.set(cacheKey, data);
            
            return res.json({
                success: true,
                data,
                cached: false
            });
            
        } catch (error) {
            logger.error('SheetDB GET error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch data from SheetDB'
            });
        }
    },
    
    /**
     * POST data to SheetDB
     * POST /api/sheetdb?sheet=orders
     */
    async postData(req, res) {
        try {
            const { sheet } = req.query;
            const data = req.body;
            
            if (!sheet) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet parameter is required'
                });
            }
            
            if (!data || Object.keys(data).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required'
                });
            }
            
            const url = `${config.sheetdbApiUrl}?sheet=${sheet}`;
            
            logger.info('Posting to SheetDB:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`SheetDB returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Invalidate cache for this sheet
            const cacheKey = cacheUtils.generateKey(sheet, {});
            cacheUtils.del(cacheKey);
            
            return res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('SheetDB POST error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to post data to SheetDB'
            });
        }
    },
    
    /**
     * PATCH data in SheetDB
     * PATCH /api/sheetdb/:identifier?sheet=products
     */
    async patchData(req, res) {
        try {
            const { sheet } = req.query;
            const { identifier } = req.params;
            const data = req.body;
            
            if (!sheet) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet parameter is required'
                });
            }
            
            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifier is required'
                });
            }
            
            if (!data || Object.keys(data).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required'
                });
            }
            
            const url = `${config.sheetdbApiUrl}/${identifier}?sheet=${sheet}`;
            
            logger.info('Patching SheetDB:', url);
            
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`SheetDB returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Invalidate cache for this sheet
            const cacheKey = cacheUtils.generateKey(sheet, {});
            cacheUtils.del(cacheKey);
            
            return res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('SheetDB PATCH error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to patch data in SheetDB'
            });
        }
    },
    
    /**
     * DELETE data from SheetDB
     * DELETE /api/sheetdb/:identifier?sheet=products
     */
    async deleteData(req, res) {
        try {
            const { sheet } = req.query;
            const { identifier } = req.params;
            
            if (!sheet) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet parameter is required'
                });
            }
            
            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifier is required'
                });
            }
            
            const url = `${config.sheetdbApiUrl}/${identifier}?sheet=${sheet}`;
            
            logger.info('Deleting from SheetDB:', url);
            
            const response = await fetch(url, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`SheetDB returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Invalidate cache for this sheet
            const cacheKey = cacheUtils.generateKey(sheet, {});
            cacheUtils.del(cacheKey);
            
            return res.json({
                success: true,
                data: result
            });
            
        } catch (error) {
            logger.error('SheetDB DELETE error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete data from SheetDB'
            });
        }
    },
    
    /**
     * Search data in SheetDB
     * GET /api/sheetdb/search?sheet=products&id=123
     */
    async searchData(req, res) {
        try {
            const { sheet, ...searchParams } = req.query;
            
            if (!sheet) {
                return res.status(400).json({
                    success: false,
                    message: 'Sheet parameter is required'
                });
            }
            
            if (Object.keys(searchParams).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one search parameter is required'
                });
            }
            
            // Build search URL
            const searchQuery = Object.entries(searchParams)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');
            
            const url = `${config.sheetdbApiUrl}/search?sheet=${sheet}&${searchQuery}`;
            
            logger.info('Searching SheetDB:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`SheetDB returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return res.json({
                success: true,
                data
            });
            
        } catch (error) {
            logger.error('SheetDB SEARCH error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to search data in SheetDB'
            });
        }
    },
    
    /**
     * Clear cache
     * POST /api/sheetdb/cache/clear
     */
    async clearCache(req, res) {
        try {
            cacheUtils.flush();
            
            return res.json({
                success: true,
                message: 'Cache cleared successfully'
            });
            
        } catch (error) {
            logger.error('Cache clear error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to clear cache'
            });
        }
    },
    
    /**
     * Get cache statistics
     * GET /api/sheetdb/cache/stats
     */
    async getCacheStats(req, res) {
        try {
            const stats = cacheUtils.getStats();
            
            return res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            logger.error('Cache stats error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get cache stats'
            });
        }
    }
};
