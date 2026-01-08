/**
 * Configuration Manager
 * Mengelola konfigurasi API URL melalui localStorage
 * Memungkinkan perubahan URL tanpa mengedit kode
 */

const CONFIG = {
    // Default API URLs
    DEFAULTS: {
        MAIN_API: 'https://sheetdb.io/api/v1/gxht1gj3on77z',
        ADMIN_API: 'https://sheetdb.io/api/v1/637uvuabexalz'
    },
    
    // Storage keys
    STORAGE_KEYS: {
        MAIN_API: 'sembako_main_api_url',
        ADMIN_API: 'sembako_admin_api_url'
    },
    
    /**
     * Mendapatkan URL API untuk halaman utama
     * @returns {string} URL API dari localStorage atau default
     */
    getMainApiUrl() {
        return localStorage.getItem(this.STORAGE_KEYS.MAIN_API) || this.DEFAULTS.MAIN_API;
    },
    
    /**
     * Mendapatkan URL API untuk halaman admin
     * @returns {string} URL API dari localStorage atau default
     */
    getAdminApiUrl() {
        return localStorage.getItem(this.STORAGE_KEYS.ADMIN_API) || this.DEFAULTS.ADMIN_API;
    },
    
    /**
     * Menyimpan URL API untuk halaman utama
     * @param {string} url - URL API baru
     */
    setMainApiUrl(url) {
        if (url && url.trim()) {
            localStorage.setItem(this.STORAGE_KEYS.MAIN_API, url.trim());
            return true;
        }
        return false;
    },
    
    /**
     * Menyimpan URL API untuk halaman admin
     * @param {string} url - URL API baru
     */
    setAdminApiUrl(url) {
        if (url && url.trim()) {
            localStorage.setItem(this.STORAGE_KEYS.ADMIN_API, url.trim());
            return true;
        }
        return false;
    },
    
    /**
     * Mereset URL API ke default
     * @param {string} type - 'main' atau 'admin'
     */
    resetToDefault(type = 'main') {
        if (type === 'main') {
            localStorage.removeItem(this.STORAGE_KEYS.MAIN_API);
        } else if (type === 'admin') {
            localStorage.removeItem(this.STORAGE_KEYS.ADMIN_API);
        }
    },
    
    /**
     * Mendapatkan semua konfigurasi saat ini
     * @returns {object} Objek berisi semua konfigurasi
     */
    getAllConfig() {
        return {
            mainApi: this.getMainApiUrl(),
            adminApi: this.getAdminApiUrl()
        };
    }
};
