/**
 * Bundle Package Carousel
 * Menampilkan produk dengan kategori "Paket" di carousel
 * Menggunakan modal dan cart system existing
 */

class BundleCarousel {
    constructor() {
        this.bundles = [];
        this.currentIndex = 0;
        this.autoRotateInterval = null;
        this.isTransitioning = false;
        this.init();
    }

    async init() {
        await this.fetchBundles();
        if (this.bundles.length > 0) {
            this.render();
            this.setupEventListeners();
            this.startAutoRotate();
        }
    }

    async fetchBundles() {
        try {
            const response = await fetch(CONFIG.getMainApiUrl());
            const allProducts = await response.json();
            
            // Filter produk dengan kategori mengandung "Paket"
            this.bundles = allProducts.filter(p => 
                p.kategori && p.kategori.toLowerCase().includes('paket')
            );
            
            console.log(`✅ Loaded ${this.bundles.length} bundle packages`);
        } catch (error) {
            console.error('❌ Error fetching bundles:', error);
            this.bundles = [];
        }
    }

    render() {
        const container = document.getElementById('bundle-carousel-container');
        if (!container || this.bundles.length === 0) {
            if (container) container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="bundle-carousel-wrapper">
                <button class="carousel-nav carousel-prev" id="carousel-prev" aria-label="Previous">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                
                <div class="carousel-track-container">
                    <div class="carousel-track" id="carousel-track">
                        ${this.bundles.map((bundle, index) => `
                            <div class="carousel-slide" data-index="${index}">
                                <div class="bundle-card" onclick="bundleCarousel.openProductModal(${index})">
                                    <div class="bundle-image-container">
                                        <img src="${bundle.gambar}" alt="${bundle.nama}" class="bundle-image">
                                        ${bundle.stok_tersedia ? `
                                            <div class="bundle-badge">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                ${bundle.stok_tersedia} Poin
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="bundle-info">
                                        <h3 class="bundle-title">${bundle.nama}</h3>
                                        <div class="bundle-price">
                                            <span class="price-label">Harga Tunai</span>
                                            <span class="price-value">Rp ${parseInt(bundle.harga_cash).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <button class="carousel-nav carousel-next" id="carousel-next" aria-label="Next">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
            
            <div class="carousel-dots" id="carousel-dots">
                ${this.bundles.map((_, index) => `
                    <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
                `).join('')}
            </div>
        `;

        this.updateCarousel();
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const dots = document.querySelectorAll('.carousel-dot');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            });
        });

        // Touch/swipe support
        const track = document.getElementById('carousel-track');
        if (track) {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;

            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                this.stopAutoRotate();
            });

            track.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
            });

            track.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                
                const diff = startX - currentX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.next();
                    } else {
                        this.prev();
                    }
                }
                
                this.startAutoRotate();
            });
        }
    }

    updateCarousel() {
        const track = document.getElementById('carousel-track');
        const dots = document.querySelectorAll('.carousel-dot');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (!track) return;

        // Determine slides per view based on screen width
        const isMobile = window.innerWidth < 768;
        const slidesPerView = isMobile ? 1 : 2;
        const slideWidth = 100 / slidesPerView;
        const peekAmount = 10; // 10% peek on each side

        // Calculate offset with peek
        const baseOffset = -(this.currentIndex * slideWidth);
        const peekOffset = isMobile ? peekAmount / 2 : peekAmount;
        const offset = baseOffset + peekOffset;

        track.style.transform = `translateX(${offset}%)`;

        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        // Update navigation buttons visibility
        if (prevBtn && nextBtn) {
            prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
            nextBtn.style.opacity = this.currentIndex >= this.bundles.length - slidesPerView ? '0.5' : '1';
        }
    }

    next() {
        if (this.isTransitioning) return;
        
        const isMobile = window.innerWidth < 768;
        const slidesPerView = isMobile ? 1 : 2;
        const maxIndex = this.bundles.length - slidesPerView;

        if (this.currentIndex >= maxIndex) {
            // Loop back to start
            this.currentIndex = 0;
        } else {
            this.currentIndex++;
        }

        this.isTransitioning = true;
        this.updateCarousel();
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    prev() {
        if (this.isTransitioning) return;
        
        const isMobile = window.innerWidth < 768;
        const slidesPerView = isMobile ? 1 : 2;
        const maxIndex = this.bundles.length - slidesPerView;

        if (this.currentIndex <= 0) {
            // Loop to end
            this.currentIndex = maxIndex;
        } else {
            this.currentIndex--;
        }

        this.isTransitioning = true;
        this.updateCarousel();
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    goToSlide(index) {
        if (this.isTransitioning) return;
        
        this.currentIndex = index;
        this.isTransitioning = true;
        this.updateCarousel();
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
        
        this.stopAutoRotate();
        this.startAutoRotate();
    }

    startAutoRotate() {
        this.stopAutoRotate();
        this.autoRotateInterval = setInterval(() => {
            this.next();
        }, 3000);
    }

    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }

    openProductModal(index) {
        const product = this.bundles[index];
        if (!product) return;

        // Stop auto-rotate
        this.stopAutoRotate();

        // Use existing showDetail function from script.js
        if (typeof showDetail === 'function') {
            showDetail(product);
        } else {
            console.error('showDetail function not found');
            alert('Fungsi modal produk tidak ditemukan. Pastikan script.js sudah dimuat.');
        }

        // Resume auto-rotate when modal closes
        const modal = document.getElementById('detail-modal');
        if (modal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        if (modal.classList.contains('hidden')) {
                            this.startAutoRotate();
                            observer.disconnect();
                        }
                    }
                });
            });
            observer.observe(modal, { attributes: true });
        }
    }

    async refresh() {
        await this.fetchBundles();
        this.currentIndex = 0;
        this.render();
        this.setupEventListeners();
        this.startAutoRotate();
    }
}

// Initialize carousel when DOM is ready
let bundleCarousel;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bundleCarousel = new BundleCarousel();
    });
} else {
    bundleCarousel = new BundleCarousel();
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (bundleCarousel) {
            bundleCarousel.updateCarousel();
        }
    }, 250);
});
