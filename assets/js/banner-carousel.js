/**
 * Paket Bundling Carousel
 * Menampilkan paket sembako bundling di carousel
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
            
            // Filter produk dengan kategori "Paket Hemat"
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
                                <div class="bundle-card" onclick="bundleCarousel.openBundleModal(${index})">
                                    <div class="bundle-image-container">
                                        <img src="${bundle.gambar}" alt="${bundle.nama}" class="bundle-image">
                                        ${bundle.stok_tersedia ? `
                                            <div class="bundle-badge">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Stok: ${bundle.stok_tersedia}
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
            // Always show both buttons, but handle edge cases in next/prev methods
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

    openBundleModal(index) {
        const bundle = this.bundles[index];
        if (!bundle) return;

        // Track click
        this.trackClick(bundle.id);

        // Parse bundle items if exists
        let bundleItems = [];
        if (bundle.bundle_items) {
            try {
                bundleItems = bundle.bundle_items.split(',').map(item => item.trim());
            } catch (e) {
                console.error('Error parsing bundle items:', e);
            }
        }

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'bundle-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.style.animation = 'fadeIn 0.3s ease';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style="animation: slideUp 0.3s ease;">
                <!-- Header -->
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                    <div class="flex items-center gap-2">
                        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                            ${bundle.kategori || 'Paket Hemat'}
                        </span>
                        ${bundle.stok_tersedia ? `
                            <span class="text-gray-600 text-xs">Stok: ${bundle.stok_tersedia}</span>
                        ` : ''}
                    </div>
                    <button onclick="document.getElementById('bundle-modal').remove()" class="text-gray-500 hover:text-gray-700 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="p-6">
                    <!-- Image Carousel -->
                    <div class="mb-4 relative">
                        <img src="${bundle.gambar}" alt="${bundle.nama}" class="w-full h-64 object-cover rounded-xl">
                    </div>

                    <!-- Title -->
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">${bundle.nama}</h2>

                    <!-- Discount Badge -->
                    ${bundle.diskon_persen ? `
                        <div class="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-bold mb-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Hemat Rp ${parseInt(bundle.diskon_persen).toLocaleString('id-ID')} dibanding harga pasar
                        </div>
                    ` : ''}

                    <!-- Bundle Items -->
                    ${bundleItems.length > 0 ? `
                        <div class="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                            <h3 class="font-bold text-green-800 mb-3 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                </svg>
                                Deskripsi / Isi Paket:
                            </h3>
                            <div class="space-y-2">
                                ${bundleItems.map(item => `
                                    <div class="flex items-start gap-2 text-gray-700">
                                        <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                        </svg>
                                        <span class="text-sm">${item}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Prices -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="p-4 bg-gray-50 rounded-xl">
                            <p class="text-xs text-gray-600 mb-1">HARGA TUNAI</p>
                            <p class="text-xl font-bold text-green-600">Rp ${parseInt(bundle.harga_cash).toLocaleString('id-ID')}</p>
                        </div>
                        <div class="p-4 bg-blue-50 rounded-xl">
                            <p class="text-xs text-gray-600 mb-1">BAYAR GAJIAN</p>
                            <p class="text-xl font-bold text-blue-600">Rp ${parseInt(bundle.harga_gajian).toLocaleString('id-ID')}</p>
                            ${bundle.tenor_gajian ? `
                                <p class="text-xs text-gray-500 mt-1">Hingga Tgl ${bundle.tenor_gajian}</p>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Quantity -->
                    <div class="mb-4">
                        <p class="font-bold text-gray-800 mb-2">Jumlah:</p>
                        <div class="flex items-center gap-4">
                            <button onclick="bundleCarousel.decreaseQuantity()" class="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                            </button>
                            <input type="number" id="bundle-quantity" value="1" min="1" class="w-16 text-center text-xl font-bold border border-gray-300 rounded-lg py-2">
                            <button onclick="bundleCarousel.increaseQuantity()" class="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Note -->
                    <div class="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2 text-sm text-blue-800">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Tersedia untuk antar Nikomas & Ambil di Tempat</span>
                    </div>

                    <!-- Actions -->
                    <div class="space-y-3">
                        <button onclick="bundleCarousel.addToCart(${index})" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            + Keranjang
                        </button>
                        <button onclick="bundleCarousel.buyNow(${index})" class="w-full bg-white hover:bg-green-50 text-green-600 font-bold py-3 rounded-xl transition border-2 border-green-600">
                            Beli Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Stop auto-rotate when modal is open
        this.stopAutoRotate();
    }

    increaseQuantity() {
        const input = document.getElementById('bundle-quantity');
        if (input) {
            input.value = parseInt(input.value) + 1;
        }
    }

    decreaseQuantity() {
        const input = document.getElementById('bundle-quantity');
        if (input && parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    }

    addToCart(index) {
        const bundle = this.bundles[index];
        const quantity = parseInt(document.getElementById('bundle-quantity')?.value || 1);
        
        // Add to cart (integrate with existing cart system)
        if (typeof addToCart === 'function') {
            addToCart(bundle, quantity);
        }
        
        // Close modal
        document.getElementById('bundle-modal')?.remove();
        
        // Show notification
        alert(`${bundle.nama} (${quantity}x) ditambahkan ke keranjang!`);
        
        // Resume auto-rotate
        this.startAutoRotate();
    }

    buyNow(index) {
        const bundle = this.bundles[index];
        const quantity = parseInt(document.getElementById('bundle-quantity')?.value || 1);
        
        // Close modal
        document.getElementById('bundle-modal')?.remove();
        
        // Open order modal (integrate with existing order system)
        if (typeof openOrderModal === 'function') {
            openOrderModal(bundle, quantity);
        } else {
            // Fallback: add to cart and show cart
            if (typeof addToCart === 'function') {
                addToCart(bundle, quantity);
            }
            if (typeof toggleCart === 'function') {
                toggleCart();
            }
        }
        
        // Resume auto-rotate
        this.startAutoRotate();
    }

    async trackClick(bundleId) {
        try {
            console.log(`📊 Bundle clicked: ${bundleId}`);
            // Implement analytics tracking if needed
        } catch (error) {
            console.error('Error tracking click:', error);
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
