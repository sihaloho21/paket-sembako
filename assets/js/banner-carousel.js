/**
 * Banner Carousel Component
 * Menampilkan banner promosi dengan navigasi dan auto-rotate
 */

class BannerCarousel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.banners = [];
        this.currentIndex = 0;
        this.autoRotateInterval = null;
        this.isHovering = false;
        this.lastInteraction = Date.now();
        
        // Options
        this.options = {
            autoRotateDelay: options.autoRotateDelay || 3000, // 3 seconds
            apiUrl: options.apiUrl || CONFIG.getMainApiUrl(),
            sheetName: options.sheetName || 'Banners',
            enableTracking: options.enableTracking !== false, // default true
            ...options
        };
        
        this.init();
    }
    
    /**
     * Initialize carousel
     */
    async init() {
        this.showLoading();
        await this.fetchBanners();
        
        if (this.banners.length > 0) {
            this.render();
            this.attachEventListeners();
            this.startAutoRotate();
        } else {
            this.showEmpty();
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="banner-loading">
                <span class="banner-loading-text">Memuat banner...</span>
            </div>
        `;
    }
    
    /**
     * Show empty state
     */
    showEmpty() {
        this.container.innerHTML = `
            <div class="banner-empty">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="banner-empty-text">Tidak ada banner promosi saat ini</span>
            </div>
        `;
    }
    
    /**
     * Fetch banners from Google Sheets via SheetDB
     */
    async fetchBanners() {
        try {
            const url = `${this.options.apiUrl}/search?sheet=${this.options.sheetName}&active=TRUE`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Sort by order field
            this.banners = data
                .filter(banner => banner.image_url && banner.image_url.trim())
                .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
            
            console.log(`✅ Loaded ${this.banners.length} active banners`);
        } catch (error) {
            console.error('❌ Error fetching banners:', error);
            this.banners = [];
        }
    }
    
    /**
     * Render carousel HTML
     */
    render() {
        const slidesHTML = this.banners.map((banner, index) => `
            <div class="banner-slide" data-index="${index}" data-banner-id="${banner.id}">
                <img 
                    src="${banner.image_url}" 
                    alt="${banner.title || 'Banner Promo'}"
                    loading="${index === 0 ? 'eager' : 'lazy'}"
                />
            </div>
        `).join('');
        
        const dotsHTML = this.banners.map((_, index) => `
            <button 
                class="banner-dot ${index === 0 ? 'active' : ''}" 
                data-index="${index}"
                aria-label="Slide ${index + 1}"
            ></button>
        `).join('');
        
        this.container.innerHTML = `
            <div class="banner-carousel-wrapper">
                <div class="banner-slides" style="transform: translateX(0%)">
                    ${slidesHTML}
                </div>
                
                ${this.banners.length > 1 ? `
                    <button class="banner-nav-btn prev" aria-label="Previous slide">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    
                    <button class="banner-nav-btn next" aria-label="Next slide">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                    
                    <div class="banner-dots">
                        ${dotsHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation buttons
        const prevBtn = this.container.querySelector('.banner-nav-btn.prev');
        const nextBtn = this.container.querySelector('.banner-nav-btn.next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        // Dots
        const dots = this.container.querySelectorAll('.banner-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                this.goToSlide(index);
            });
        });
        
        // Banner clicks
        const slides = this.container.querySelectorAll('.banner-slide');
        slides.forEach(slide => {
            slide.addEventListener('click', () => {
                const index = parseInt(slide.dataset.index);
                const bannerId = slide.dataset.bannerId;
                this.handleBannerClick(index, bannerId);
            });
        });
        
        // Hover to pause auto-rotate
        this.container.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.stopAutoRotate();
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.lastInteraction = Date.now();
            this.startAutoRotate();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }
    
    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (index < 0 || index >= this.banners.length) return;
        
        this.currentIndex = index;
        this.updateSlidePosition();
        this.updateDots();
        this.lastInteraction = Date.now();
        
        // Restart auto-rotate after interaction
        this.stopAutoRotate();
        if (!this.isHovering) {
            this.startAutoRotate();
        }
    }
    
    /**
     * Go to previous slide
     */
    prev() {
        const newIndex = this.currentIndex === 0 
            ? this.banners.length - 1 
            : this.currentIndex - 1;
        this.goToSlide(newIndex);
    }
    
    /**
     * Go to next slide
     */
    next() {
        const newIndex = this.currentIndex === this.banners.length - 1 
            ? 0 
            : this.currentIndex + 1;
        this.goToSlide(newIndex);
    }
    
    /**
     * Update slide position
     */
    updateSlidePosition() {
        const slidesContainer = this.container.querySelector('.banner-slides');
        if (slidesContainer) {
            const translateX = -this.currentIndex * 100;
            slidesContainer.style.transform = `translateX(${translateX}%)`;
        }
    }
    
    /**
     * Update dots indicator
     */
    updateDots() {
        const dots = this.container.querySelectorAll('.banner-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    /**
     * Handle banner click
     */
    async handleBannerClick(index, bannerId) {
        const banner = this.banners[index];
        
        if (!banner) return;
        
        // Track click
        if (this.options.enableTracking) {
            await this.trackClick(bannerId, banner);
        }
        
        // Redirect to URL
        if (banner.redirect_url && banner.redirect_url.trim()) {
            window.open(banner.redirect_url, '_blank');
        }
        
        console.log(`🎯 Banner clicked: ${banner.title || 'Untitled'}`);
    }
    
    /**
     * Track banner click
     */
    async trackClick(bannerId, banner) {
        try {
            const currentClicks = parseInt(banner.clicks) || 0;
            const newClicks = currentClicks + 1;
            
            const url = `${this.options.apiUrl}/id/${bannerId}?sheet=${this.options.sheetName}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clicks: newClicks
                })
            });
            
            if (response.ok) {
                banner.clicks = newClicks;
                console.log(`📊 Click tracked: ${banner.title} (${newClicks} clicks)`);
            }
        } catch (error) {
            console.error('❌ Error tracking click:', error);
        }
    }
    
    /**
     * Start auto-rotate
     */
    startAutoRotate() {
        if (this.banners.length <= 1) return;
        
        this.stopAutoRotate();
        
        this.autoRotateInterval = setInterval(() => {
            if (!this.isHovering) {
                this.next();
            }
        }, this.options.autoRotateDelay);
    }
    
    /**
     * Stop auto-rotate
     */
    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }
    
    /**
     * Destroy carousel
     */
    destroy() {
        this.stopAutoRotate();
        this.container.innerHTML = '';
    }
    
    /**
     * Refresh banners
     */
    async refresh() {
        this.stopAutoRotate();
        await this.init();
    }
}

// Initialize carousel when DOM is ready
let bannerCarousel = null;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('banner-carousel-container');
    
    if (container) {
        bannerCarousel = new BannerCarousel('banner-carousel-container', {
            autoRotateDelay: 3000, // 3 seconds
            enableTracking: true
        });
    }
});

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.BannerCarousel = BannerCarousel;
    window.bannerCarousel = bannerCarousel;
}
