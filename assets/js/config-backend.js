/**
 * Configuration Manager (Backend Version)
 * Updated to use secure backend API Gateway instead of direct SheetDB access
 */

import { logger } from './logger.js';

export const CONFIG = {
    // Backend API URL (change this to your deployed backend URL)
    BACKEND_API_URL: 'http://localhost:3001/api',
    
    // Storage keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'sembako_auth_token',
        USER_DATA: 'sembako_user_data',
        GAJIAN_CONFIG: 'sembako_gajian_config',
        REWARD_CONFIG: 'sembako_reward_config',
        STORE_CLOSED: 'sembako_store_closed'
    },
    
    /**
     * Get backend API URL
     * @returns {string} Backend API URL
     */
    getBackendUrl() {
        // In production, this should be your deployed backend URL
        // Example: 'https://api.paketsembako.com/api'
        return this.BACKEND_API_URL;
    },
    
    /**
     * Get SheetDB proxy URL (through backend)
     * @returns {string} SheetDB proxy URL
     */
    getMainApiUrl() {
        return `${this.getBackendUrl()}/sheetdb`;
    },
    
    /**
     * Get auth token from storage
     * @returns {string|null} JWT token
     */
    getAuthToken() {
        return localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    },
    
    /**
     * Set auth token in storage
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
        }
    },
    
    /**
     * Get user data from storage
     * @returns {object|null} User data
     */
    getUserData() {
        const data = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                logger.error('Error parsing user data', e);
                return null;
            }
        }
        return null;
    },
    
    /**
     * Set user data in storage
     * @param {object} userData - User data
     */
    setUserData(userData) {
        if (userData) {
            localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        } else {
            localStorage.removeItem(this.STORAGE_KEYS.USER_DATA);
        }
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.getAuthToken();
    },
    
    /**
     * Clear authentication data
     */
    clearAuth() {
        this.setAuthToken(null);
        this.setUserData(null);
        logger.info('Authentication data cleared');
    },
    
    /**
     * Mendapatkan konfigurasi Bayar Gajian
     * @returns {object} Konfigurasi gajian
     */
    getGajianConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEYS.GAJIAN_CONFIG);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                logger.error('Error parsing gajian config', e);
            }
        }
        return {
            targetDay: 7,
            markups: [
                { minDays: 29, rate: 0.20 },
                { minDays: 26, rate: 0.18 },
                { minDays: 23, rate: 0.16 },
                { minDays: 20, rate: 0.14 },
                { minDays: 17, rate: 0.12 },
                { minDays: 14, rate: 0.10 },
                { minDays: 11, rate: 0.08 },
                { minDays: 8, rate: 0.06 },
                { minDays: 3, rate: 0.04 },
                { minDays: 0, rate: 0.02 }
            ],
            defaultMarkup: 0.25
        };
    },

    /**
     * Menyimpan konfigurasi Bayar Gajian
     * @param {object} config - Konfigurasi baru
     */
    setGajianConfig(config) {
        localStorage.setItem(this.STORAGE_KEYS.GAJIAN_CONFIG, JSON.stringify(config));
    },

    /**
     * Mendapatkan konfigurasi Reward Poin
     * @returns {object} Konfigurasi reward
     */
    getRewardConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEYS.REWARD_CONFIG);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                logger.error('Error parsing reward config', e);
            }
        }
        return {
            pointValue: 10000, // 10.000 IDR = 1 point
            minPoint: 0.1,
            manualOverrides: {} // { productName: points }
        };
    },

    /**
     * Menyimpan konfigurasi Reward Poin
     * @param {object} config - Konfigurasi baru
     */
    setRewardConfig(config) {
        localStorage.setItem(this.STORAGE_KEYS.REWARD_CONFIG, JSON.stringify(config));
    },

    /**
     * Mendapatkan status toko (tutup/buka)
     * @returns {boolean} true jika toko tutup
     */
    isStoreClosed() {
        return localStorage.getItem(this.STORAGE_KEYS.STORE_CLOSED) === 'true';
    },

    /**
     * Mengatur status toko
     * @param {boolean} closed - true untuk menutup toko
     */
    setStoreClosed(closed) {
        localStorage.setItem(this.STORAGE_KEYS.STORE_CLOSED, closed ? 'true' : 'false');
    },

    /**
     * Mendapatkan semua konfigurasi saat ini
     * @returns {object} Objek berisi semua konfigurasi
     */
    getAllConfig() {
        return {
            backendUrl: this.getBackendUrl(),
            isAuthenticated: this.isAuthenticated(),
            userData: this.getUserData(),
            gajian: this.getGajianConfig(),
            reward: this.getRewardConfig(),
            storeClosed: this.isStoreClosed()
        };
    }
};
