/**
 * Main Entry Point for Paket Sembako Application
 * ES Module version
 */

import { CONFIG } from './config.js';
import { ApiService } from './api-service.js';
import { calculateGajianPrice, calculateRewardPoints } from './payment-logic.js';
import { logger } from './logger.js';

// Make essential functions globally available for inline event handlers
// TODO: Refactor to remove inline handlers in future
window.CONFIG = CONFIG;
window.ApiService = ApiService;
window.calculateGajianPrice = calculateGajianPrice;
window.calculateRewardPoints = calculateRewardPoints;

/**
 * Get API URL from localStorage (set by admin) or fallback to CONFIG
 */
function getApiUrl() {
    const apiUrl = CONFIG.getMainApiUrl();
    logger.log('Using API URL:', apiUrl);
    return apiUrl;
}

let API_URL = getApiUrl();

/**
 * Refresh API_URL from localStorage
 */
window.refreshApiUrl = function() {
    API_URL = getApiUrl();
    logger.log('API URL refreshed:', API_URL);
    fetchProducts();
}

// Application state
let cart = JSON.parse(localStorage.getItem('sembako_cart')) || [];
let allProducts = [];
let currentCategory = 'Semua';
let currentPage = 1;
const itemsPerPage = 12;
let filteredProducts = [];
let storeClosed = CONFIG.isStoreClosed();
let selectedVariation = null;

/**
 * Fetch products from API
 */
async function fetchProducts() {
    try {
        const products = await ApiService.get('?sheet=products', {
            cacheDuration: 5 * 60 * 1000
        });
        logger.log('Products received:', products);
        
        allProducts = products.map(p => {
            const cashPrice = parseInt(p.harga) || 0;
            const gajianInfo = calculateGajianPrice(cashPrice);
            
            let category = p.kategori || 'Bahan Pokok';
            if (!p.kategori) {
                if (cashPrice >= 150000) category = 'Paket Lengkap';
                else if (cashPrice >= 50000) category = 'Paket Hemat';
            }
            
            const defaultDesc = "Kualitas Terjamin, Stok Selalu Baru, Harga Kompetitif";
            
            let variations = [];
            if (p.variasi) {
                try {
                    variations = JSON.parse(p.variasi);
                } catch (e) {
                    logger.error('Error parsing variations for product:', p.id, e);
                }
            }

            return {
                ...p,
                harga: cashPrice,
                hargaCoret: parseInt(p.harga_coret) || 0,
                hargaGajian: gajianInfo.price,
                stok: parseInt(p.stok) || 0,
                category: category,
                deskripsi: (p.deskripsi && p.deskripsi.trim() !== "") ? p.deskripsi : defaultDesc,
                variations: variations
            };
        });
        
        filterProducts();
        updateCartUI();
        checkStoreStatus();
        startNotificationLoop();
    } catch (error) {
        logger.error('Error fetching products:', error);
        showDynamicNotification('Gagal memuat produk. Silakan coba lagi nanti.', 'error');
        const grid = document.getElementById('product-grid');
        if (grid) {
            grid.innerHTML = '<p class="text-center col-span-full text-red-500">Gagal memuat produk. Silakan coba lagi nanti.</p>';
        }
    }
}

/**
 * Enhanced notification system with dynamic messages
 */
function showDynamicNotification(message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const colors = {
        success: '#15803d',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Export for global use
window.showDynamicNotification = showDynamicNotification;
window.fetchProducts = fetchProducts;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    logger.log('Initializing Paket Sembako app...');
    
    // Fetch bootstrap settings if configured
    await CONFIG.fetchSettings();
    
    // Load products
    await fetchProducts();
    
    logger.log('App initialized successfully');
}

// Note: The rest of script.js functions need to be imported here or refactored
// For now, we keep them in script.js and load both files
