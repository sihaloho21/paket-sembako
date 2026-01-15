/**
 * Banner Carousel - Peek Design & Modal Integration
 */

class BannerCarousel {
    constructor() {
        this.banners = [];
        this.currentIndex = 0;
        this.autoRotateInterval = null;
        this.isDesktop = window.innerWidth > 768;
        this.init();
    }

    async init() {
        await this.fetchBanners();
        this.render();
        this.setupEventListeners();
        if (this.banners.length > 1) this.startAutoRotate();
    }

    async fetchBanners() {
        try {
            const response = await fetch(`${CONFIG.getMainApiUrl()}?sheet=Banners`);
            const data = await response.json();
            this.banners = data.filter(b => b.active === 'TRUE').sort((a, b) => a.order - b.order);
        } catch (error) {
            console.error('Error fetching banners:', error);
            this.banners = [];
        }
    }

    render() {
        const container = document.getElementById('banner-carousel-container');
        if (!container) return;

        if (this.banners.length === 0) {
            container.innerHTML = `
                <div class="banner-empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p>Tidak ada banner promosi saat ini</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="banner-carousel">
                <div class="banner-carousel-track" id="banner-track">
                    ${this.banners.map((banner, index) => `
                        <div class="banner-slide" data-index="${index}" data-banner-id="${banner.id}">
                            <img src="${banner.image_url}" alt="${banner.title}" loading="${index < 2 ? 'eager' : 'lazy'}">
                        </div>
                    `).join('')}
                </div>
                ${this.banners.length > 1 ? `
                    <button class="banner-nav-btn prev" id="banner-prev">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    <button class="banner-nav-btn next" id="banner-next">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
            ${this.banners.length > 1 ? `
                <div class="banner-dots" id="banner-dots">
                    ${this.banners.map((_, index) => `
                        <button class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        this.updatePosition();
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('banner-prev');
        const nextBtn = document.getElementById('banner-next');
        const dots = document.querySelectorAll('.banner-dot');
        const slides = document.querySelectorAll('.banner-slide');

        if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.goToSlide(parseInt(e.target.dataset.index));
            });
        });

        slides.forEach(slide => {
            slide.addEventListener('click', () => {
                const bannerId = slide.dataset.bannerId;
                const banner = this.banners.find(b => b.id == bannerId);
                if (banner) {
                    this.trackClick(bannerId);
                    this.openPromoModal(banner);
                }
            });
        });

        const carousel = document.querySelector('.banner-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopAutoRotate());
            carousel.addEventListener('mouseleave', () => {
                if (this.banners.length > 1) this.startAutoRotate();
            });
        }

        window.addEventListener('resize', () => {
            const wasDesktop = this.isDesktop;
            this.isDesktop = window.innerWidth > 768;
            if (wasDesktop !== this.isDesktop) this.updatePosition();
        });
    }

    updatePosition() {
        const track = document.getElementById('banner-track');
        if (!track) return;

        const slideWidth = this.isDesktop ? 50 : 80;
        const gap = 1;
        const offset = this.currentIndex * (slideWidth + gap);
        
        track.style.transform = `translateX(calc(-${offset}% - ${this.currentIndex * gap}rem))`;
        this.updateDots();
    }

    updateDots() {
        const dots = document.querySelectorAll('.banner-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.banners.length;
        this.updatePosition();
        this.resetAutoRotate();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
        this.updatePosition();
        this.resetAutoRotate();
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updatePosition();
        this.resetAutoRotate();
    }

    startAutoRotate() {
        this.stopAutoRotate();
        this.autoRotateInterval = setInterval(() => this.next(), 3000);
    }

    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }

    resetAutoRotate() {
        if (this.banners.length > 1) {
            this.stopAutoRotate();
            this.startAutoRotate();
        }
    }

    async trackClick(bannerId) {
        try {
            const banner = this.banners.find(b => b.id == bannerId);
            const newClicks = parseInt(banner.clicks || 0) + 1;
            
            await fetch(`${CONFIG.getMainApiUrl()}/id/${bannerId}?sheet=Banners`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clicks: newClicks })
            });
            
            banner.clicks = newClicks;
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    }

    async openPromoModal(banner) {
        const productNames = banner.promo_products ? banner.promo_products.split(',').map(p => p.trim()) : [];
        const products = await this.fetchRelatedProducts(productNames);

        const modal = document.createElement('div');
        modal.id = 'promo-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.style.animation = 'fadeIn 0.3s ease';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style="animation: slideUp 0.3s ease;">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                    <h2 class="text-xl font-bold text-gray-800">${banner.title}</h2>
                    <button onclick="document.getElementById('promo-modal').remove()" class="text-gray-500 hover:text-gray-700 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="p-6">
                    <img src="${banner.image_url}" alt="${banner.title}" class="w-full rounded-lg mb-4 shadow-lg">
                    
                    ${banner.promo_description ? `
                        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h3 class="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Deskripsi Promo
                            </h3>
                            <p class="text-gray-700 leading-relaxed">${banner.promo_description}</p>
                        </div>
                    ` : ''}
                    
                    ${products.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                                Pilih Produk Promo
                            </h3>
                            <div class="space-y-2" id="promo-products">
                                ${products.map(product => `
                                    <label class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                        <input type="checkbox" class="promo-product-checkbox w-5 h-5 text-green-600 rounded" data-product='${JSON.stringify(product)}'>
                                        <img src="${product.gambar}" alt="${product.nama}" class="w-16 h-16 object-cover rounded border">
                                        <div class="flex-1">
                                            <p class="font-medium text-gray-800 text-sm">${product.nama}</p>
                                            <p class="text-green-600 font-bold">Rp ${parseInt(product.harga_cash).toLocaleString('id-ID')}</p>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <button onclick="bannerCarousel.addToOrder()" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10.5 2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM10.5 21.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM2.25 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM21.75 10.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z"/><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clip-rule="evenodd"/>
                        </svg>
                        Lengkapi Pesanan
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async fetchRelatedProducts(productNames) {
        if (productNames.length === 0) return [];
        
        try {
            const response = await fetch(CONFIG.getMainApiUrl());
            const allProducts = await response.json();
            return allProducts.filter(p => productNames.includes(p.nama));
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    addToOrder() {
        const selectedProducts = [];
        document.querySelectorAll('.promo-product-checkbox:checked').forEach(checkbox => {
            selectedProducts.push(JSON.parse(checkbox.dataset.product));
        });

        if (selectedProducts.length === 0) {
            alert('Silakan pilih minimal 1 produk');
            return;
        }

        document.getElementById('promo-modal').remove();

        selectedProducts.forEach(product => {
            if (typeof addToCart === 'function') {
                addToCart(product);
            }
        });

        if (typeof openCheckout === 'function') {
            setTimeout(() => openCheckout(), 300);
        }
    }
}

let bannerCarousel;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bannerCarousel = new BannerCarousel();
    });
} else {
    bannerCarousel = new BannerCarousel();
}

// Animations
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
`;
document.head.appendChild(style);
