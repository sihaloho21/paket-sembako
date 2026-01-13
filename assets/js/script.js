let API_URL = CONFIG.getMainApiUrl();
let cart = JSON.parse(localStorage.getItem('sembako_cart')) || [];
let allProducts = [];
let currentCategory = 'Semua';
let storeClosed = CONFIG.isStoreClosed();
let selectedVariation = null;

// calculateGajianPrice is now handled in assets/js/payment-logic.js

async function fetchProducts() {
    try {
        console.log('Fetching products from:', API_URL);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const products = await response.json();
        console.log('Products received:', products);
        
        allProducts = products.map(p => {
            const cashPrice = parseInt(p.harga) || 0;
            const gajianInfo = calculateGajianPrice(cashPrice);
            
            let category = p.kategori || 'Bahan Pokok';
            if (!p.kategori) {
                if (cashPrice >= 150000) category = 'Paket Lengkap';
                else if (cashPrice >= 50000) category = 'Paket Hemat';
            }
            
            const defaultDesc = "Kualitas Terjamin, Stok Selalu Baru, Harga Kompetitif";
            
            // Phase 1 & 2: Parse variations
            let variations = [];
            if (p.variasi) {
                try {
                    variations = JSON.parse(p.variasi);
                } catch (e) {
                    console.error('Error parsing variations for product:', p.id, e);
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
        renderProducts(allProducts);
        updateCartUI();
        checkStoreStatus();
        startNotificationLoop();
    } catch (error) {
        console.error('Error fetching products:', error);
        const grid = document.getElementById('product-grid');
        if (grid) {
            grid.innerHTML = '<p class="text-center col-span-full text-red-500">Gagal memuat produk. Silakan coba lagi nanti.</p>';
        }
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<p class="text-center col-span-full text-gray-500 py-10">Tidak ada produk yang ditemukan.</p>';
        return;
    }
    
    grid.innerHTML = '';
    products.forEach(p => {
        let stokLabel = '';
        if (p.stok > 5) {
            stokLabel = `<span class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Stok Tersedia</span>`;
        } else if (p.stok > 0) {
            stokLabel = `<span class="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Stok Terbatas (${p.stok})</span>`;
        } else {
            stokLabel = `<span class="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Stok Habis</span>`;
        }

        const pData = JSON.stringify(p).replace(/"/g, '&quot;');
        const images = p.gambar ? p.gambar.split(',') : [];
        const mainImage = images[0] || 'https://via.placeholder.com/300x200?text=Produk';

        const rewardPoints = calculateRewardPoints(p.harga, p.nama);
        
        // Parse wholesale pricing
        let grosirGridHtml = '';
        let hasGrosir = false;
        if (p.grosir) {
            try {
                const tiers = JSON.parse(p.grosir);
                if (Array.isArray(tiers) && tiers.length > 0) {
                    hasGrosir = true;
                    const sortedTiers = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
                    const gridItems = sortedTiers.map(t => `
                        <div class="bg-green-50 border border-green-100 rounded-lg p-1.5 text-center">
                            <p class="text-[8px] text-green-600 font-bold uppercase leading-tight">Min. ${t.min_qty}</p>
                            <p class="text-[10px] text-green-700 font-black">Rp ${t.price.toLocaleString('id-ID')}</p>
                        </div>
                    `).join('');
                    grosirGridHtml = `
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            ${gridItems}
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Error parsing grosir data for product:', p.id, e);
            }
        }

        let hargaCoretHtml = '';
        if (p.hargaCoret > p.harga) {
            const diskon = Math.round(((p.hargaCoret - p.harga) / p.hargaCoret) * 100);
            hargaCoretHtml = `
                <div class="flex items-center gap-1 mb-0.5">
                    <span class="text-[10px] text-gray-400 line-through">Rp ${p.hargaCoret.toLocaleString('id-ID')}</span>
                    <span class="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">-${diskon}%</span>
                </div>
            `;
        }

        const hasVariations = p.variations && p.variations.length > 0;

        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 relative">
                <div class="absolute top-3 left-3 z-10 flex flex-col gap-2">
                    <div class="bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        +${rewardPoints} Poin
                    </div>
                    ${hasGrosir ? `
                    <div class="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7c.78.78.78 2.047 0 2.828l-7 7c-.78.78-2.047.78-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Harga Grosir Tersedia
                    </div>
                    ` : ''}
                </div>
                <img src="${mainImage}" alt="${p.nama}" onclick='showDetail(${pData})' class="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity ${p.stok === 0 ? 'grayscale opacity-60' : ''}" onerror="this.src='https://via.placeholder.com/300x200?text=Produk'">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="text-lg font-bold text-gray-800">${p.nama}</h4>
                        ${stokLabel}
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <button onclick="shareProduct('${p.nama}')" class="text-green-600 hover:text-green-700 flex items-center gap-1 text-xs font-medium">
                            <span>Share</span>
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-green-50 p-3 rounded-lg">
                            <p class="text-[10px] text-green-600 font-bold uppercase">Harga Cash</p>
                            <div class="flex flex-col">
                                ${hargaCoretHtml}
                                <p class="text-lg font-bold text-green-700">Rp ${p.harga.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <p class="text-[10px] text-blue-600 font-bold uppercase">Bayar Gajian</p>
                            <div class="flex flex-col">
                                <p class="text-[8px] text-blue-400 mb-0.5">Harga Per Tgl ${new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-')}</p>
                                <p class="text-lg font-bold text-blue-700">Rp ${p.hargaGajian.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    ${grosirGridHtml}
                    ${hasVariations ? `
                    <button onclick='showDetail(${pData})' class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        Pilih Variasi
                    </button>
                    ` : `
                    <button onclick='addToCart(${pData}, event)' ${p.stok === 0 ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Tambah ke Keranjang
                    </button>
                    `}
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick='showDetail(${pData})' class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 rounded-lg text-sm transition">Rincian</button>
                        <button onclick='directOrder(${pData})' ${p.stok === 0 ? 'disabled' : ''} class="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 rounded-lg text-sm transition">Beli Sekarang</button>
                    </div>

                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allProducts.filter(p => {
        const matchesSearch = p.nama.toLowerCase().includes(query) || 
                            (p.deskripsi && p.deskripsi.toLowerCase().includes(query));
        const matchesCategory = currentCategory === 'Semua' || p.category === currentCategory;
        return matchesSearch && matchesCategory;
    });
    renderProducts(filtered);
}

function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.innerText === cat) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    filterProducts();
}

function addToCart(p, event, qty = 1) {
    if (storeClosed) {
        showStoreWarning(() => {
            proceedAddToCart(p, event, qty);
        });
        return;
    }
    proceedAddToCart(p, event, qty);
}

function proceedAddToCart(p, event, qty = 1) {
    // If product has variations and none selected, show detail
    if (p.variations && p.variations.length > 0 && !selectedVariation) {
        showDetail(p);
        return;
    }

    const itemToAdd = { ...p };
    if (selectedVariation) {
        itemToAdd.selectedVariation = selectedVariation;
        itemToAdd.harga = selectedVariation.harga;
        itemToAdd.sku = selectedVariation.sku;
        itemToAdd.stok = selectedVariation.stok;
        // Recalculate gajian price for variation
        const gajianInfo = calculateGajianPrice(selectedVariation.harga);
        itemToAdd.hargaGajian = gajianInfo.price;
    }

    const existing = cart.find(item => {
        const sameId = item.id === itemToAdd.id;
        const sameVariation = (!item.selectedVariation && !itemToAdd.selectedVariation) || 
                             (item.selectedVariation && itemToAdd.selectedVariation && item.selectedVariation.sku === itemToAdd.selectedVariation.sku);
        return sameId && sameVariation;
    });

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...itemToAdd, qty: qty });
    }
    
    saveCart();
    updateCartUI();
    
    // Reset selected variation after adding to cart
    selectedVariation = null;

    // Fly to cart animation
    if (event && event.currentTarget) {
        const btn = event.currentTarget;
        const card = btn.closest('.bg-white') || document.getElementById('detail-modal');
        const img = card.querySelector('img');
        const cartBtn = document.querySelector('header button');
        
        if (img && cartBtn) {
            const imgRect = img.getBoundingClientRect();
            const cartRect = cartBtn.getBoundingClientRect();
            
            const flyImg = document.createElement('img');
            flyImg.src = img.src;
            flyImg.className = 'fly-item';
            flyImg.style.top = `${imgRect.top}px`;
            flyImg.style.left = `${imgRect.left}px`;
            flyImg.style.width = `${imgRect.width}px`;
            flyImg.style.height = `${imgRect.height}px`;
            flyImg.style.borderRadius = '12px';
            
            document.body.appendChild(flyImg);
            
            // Trigger animation
            requestAnimationFrame(() => {
                flyImg.style.top = `${cartRect.top + cartRect.height / 2}px`;
                flyImg.style.left = `${cartRect.left + cartRect.width / 2}px`;
                flyImg.style.width = '20px';
                flyImg.style.height = '20px';
                flyImg.style.opacity = '0.5';
                flyImg.style.borderRadius = '50%';
            });
            
            setTimeout(() => {
                flyImg.remove();
                cartBtn.classList.add('cart-pop');
                setTimeout(() => cartBtn.classList.remove('cart-pop'), 400);
            }, 800);
        }
    } else {
        // Fallback if no event (e.g. from modal)
        const cartBtn = document.querySelector('header button');
        if (cartBtn) {
            cartBtn.classList.add('cart-pop');
            setTimeout(() => cartBtn.classList.remove('cart-pop'), 400);
        }
    }

    // Show Toast
    showToast(`${itemToAdd.nama}${itemToAdd.selectedVariation ? ' (' + itemToAdd.selectedVariation.nama + ')' : ''} ditambahkan ke keranjang`);
}

function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function saveCart() {
    localStorage.setItem('sembako_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const countEl = document.getElementById('cart-count');
    
    if (countEl) {
        if (count > 0) {
            countEl.innerText = count;
            countEl.classList.remove('hidden');
        } else {
            countEl.classList.add('hidden');
        }
    }

    const itemsContainer = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    const empty = document.getElementById('cart-empty');

    if (!itemsContainer) return;

    if (cart.length === 0) {
        itemsContainer.innerHTML = '';
        if (footer) footer.classList.add('hidden');
        if (empty) empty.classList.remove('hidden');
    } else {
        if (empty) empty.classList.add('hidden');
        if (footer) footer.classList.remove('hidden');
        
        let total = 0;
        itemsContainer.innerHTML = cart.map((item, index) => {
            // Calculate tiered price
            const effectivePrice = calculateTieredPrice(item.harga, item.qty, item.grosir);
            const isGrosir = effectivePrice < item.harga;
            const itemTotal = effectivePrice * item.qty;
            total += itemTotal;
            
            const images = item.gambar ? item.gambar.split(',') : [];
            let mainImage = images[0] || 'https://via.placeholder.com/100x100?text=Produk';
            if (item.selectedVariation && item.selectedVariation.gambar) {
                mainImage = item.selectedVariation.gambar;
            }
            return `
                <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
                    <img src="${mainImage}" class="w-16 h-16 object-cover rounded-lg">
                    <div class="flex-1">
                        <h5 class="font-bold text-gray-800 text-sm">${item.nama}${item.selectedVariation ? ' (' + item.selectedVariation.nama + ')' : ''}</h5>
                        <div class="flex flex-col">
                            ${isGrosir ? `<span class="text-[10px] text-gray-400 line-through">Rp ${item.harga.toLocaleString('id-ID')}</span>` : ''}
                            <p class="text-green-600 font-bold text-xs">Rp ${effectivePrice.toLocaleString('id-ID')} ${isGrosir ? '<span class="bg-green-100 text-green-700 text-[8px] px-1 rounded ml-1">Grosir</span>' : ''}</p>
                        </div>
                        <div class="flex items-center gap-3 mt-2">
                            <button onclick="updateQty(${index}, -1)" class="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500">-</button>
                            <span class="text-sm font-bold">${item.qty}</span>
                            <button onclick="updateQty(${index}, 1)" class="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500">+</button>
                        </div>
                    </div>
                    <button onclick="removeItem(${index})" class="text-red-400 hover:text-red-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        }).join('');
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    }
}

function updateQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
    }
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}

function updateModalQty(delta) {
    const qtyInput = document.getElementById('modal-qty');
    if (!qtyInput) return;
    
    let qty = parseInt(qtyInput.value) || 1;
    qty += delta;
    if (qty < 1) qty = 1;
    qtyInput.value = qty;
    
    // Trigger the oninput handler to update UI
    qtyInput.oninput({ target: qtyInput });
}

function showDetail(p) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    // Reset selected variation and quantity when opening modal
    selectedVariation = null;
    const qtyInput = document.getElementById('modal-qty');
    if (qtyInput) qtyInput.value = 1;

    const nameEl = document.getElementById('modal-product-name');
    const imageEl = document.getElementById('modal-product-image');
    const cashPriceEl = document.getElementById('modal-cash-price');
    const gajianPriceEl = document.getElementById('modal-gajian-price');
    const priceDateEl = document.getElementById('modal-price-date');
    const itemsListEl = document.getElementById('modal-items-list');
    const badgesEl = document.getElementById('modal-badges');
    const savingsHighlight = document.getElementById('savings-highlight');
    const savingsAmount = document.getElementById('savings-amount');
    const variationContainer = document.getElementById('modal-variation-container');

    if (nameEl) nameEl.innerText = p.nama;
    
    // Handle Variations UI
    if (variationContainer) {
        if (p.variations && p.variations.length > 0) {
            variationContainer.classList.remove('hidden');
            const variationList = document.getElementById('modal-variation-list');
            variationList.innerHTML = p.variations.map((v, idx) => `
                <button onclick='selectVariation(${JSON.stringify(v).replace(/"/g, '&quot;')}, ${idx})' class="variation-btn border-2 border-gray-200 rounded-xl p-3 text-left transition hover:border-green-500 focus:outline-none" data-index="${idx}">
                    <p class="text-xs font-bold text-gray-800">${v.nama}</p>
                    <p class="text-[10px] text-green-600 font-bold">Rp ${v.harga.toLocaleString('id-ID')}</p>
                    ${v.stok <= 0 ? '<p class="text-[8px] text-red-500 font-bold">Stok Habis</p>' : ''}
                </button>
            `).join('');
            
            // Select first variation by default
            selectVariation(p.variations[0], 0);
        } else {
            variationContainer.classList.add('hidden');
            updateModalPrices(p.harga, p.hargaGajian, p.hargaCoret);
        }
    } else {
        updateModalPrices(p.harga, p.hargaGajian, p.hargaCoret);
    }

    if (priceDateEl) {
        priceDateEl.innerText = `Harga Per Tgl ${new Date().toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '-')}`;
    }

    if (badgesEl) {
        badgesEl.innerHTML = `
            <span class="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-lg font-bold">${p.category}</span>
            ${p.stok > 0 ? 
                `<span class="bg-blue-100 text-blue-700 text-[10px] px-2.5 py-1 rounded-lg font-bold">Stok: ${p.stok}</span>` : 
                `<span class="bg-red-100 text-red-700 text-[10px] px-2.5 py-1 rounded-lg font-bold">Stok Habis</span>`
            }
        `;
    }

    // Initialize Image Slider
    const images = p.gambar ? p.gambar.split(',') : [];
    if (typeof initializeSlider === 'function') {
        initializeSlider(images);
    } else if (imageEl) {
        imageEl.src = images.length > 0 ? images[0] : 'https://via.placeholder.com/300x200?text=Produk';
        imageEl.onerror = function() { this.src = 'https://via.placeholder.com/300x200?text=Produk'; };
    }

    if (itemsListEl) {
        const items = p.deskripsi.split('\n').filter(i => i.trim() !== "");
        const icons = ['🍜', '🍲', '📦', '☕', '🍚', '🍳', '🧂'];
        itemsListEl.innerHTML = items.map((item, idx) => `
            <div class="flex items-center gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                <span class="text-xl">${icons[idx % icons.length]}</span>
                <span class="text-sm font-medium text-gray-700">${item.trim()}</span>
            </div>
        `).join('');
    }

    // Tiered Pricing Logic in Modal
    if (typeof updateTieredPricingUI === 'function') {
        updateTieredPricingUI(p, 1);
        
        // Add listener for quantity changes if it doesn't exist
        const qtyInput = document.getElementById('modal-qty'); // Assuming there's a qty input
        if (qtyInput) {
            qtyInput.oninput = (e) => {
                const qty = parseInt(e.target.value) || 1;
                updateTieredPricingUI(p, qty);
                
                // Also update modal prices based on tiered price
                const effectivePrice = calculateTieredPrice(p.harga, qty, p.grosir);
                const gajianInfo = calculateGajianPrice(effectivePrice);
                updateModalPrices(effectivePrice, gajianInfo.price, p.hargaCoret || 0);
            };
        }
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function selectVariation(v, index) {
    selectedVariation = v;
    
    // Update UI for selected button
    document.querySelectorAll('.variation-btn').forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('border-green-500', 'bg-green-50');
            btn.classList.remove('border-gray-200');
        } else {
            btn.classList.remove('border-green-500', 'bg-green-50');
            btn.classList.add('border-gray-200');
        }
    });

    // Update prices based on variation
    const gajianInfo = calculateGajianPrice(v.harga);
    updateModalPrices(v.harga, gajianInfo.price, v.harga_coret || 0);
    
    // Update image if variation has one
    if (v.gambar) {
        const imageEl = document.getElementById('modal-product-image');
        if (imageEl) imageEl.src = v.gambar;
        // If slider exists, we might want to update it too, but for now just the main image
    }
}

function updateModalPrices(cash, gajian, coret) {
    const cashPriceEl = document.getElementById('modal-cash-price');
    const gajianPriceEl = document.getElementById('modal-gajian-price');
    const savingsHighlight = document.getElementById('savings-highlight');
    const savingsAmount = document.getElementById('savings-amount');

    if (cashPriceEl) cashPriceEl.innerText = `Rp ${cash.toLocaleString('id-ID')}`;
    if (gajianPriceEl) gajianPriceEl.innerText = `Rp ${gajian.toLocaleString('id-ID')}`;

    if (coret > cash) {
        if (savingsHighlight) savingsHighlight.classList.remove('hidden');
        if (savingsAmount) savingsAmount.innerText = `Rp ${(coret - cash).toLocaleString('id-ID')}`;
    } else {
        if (savingsHighlight) savingsHighlight.classList.add('hidden');
    }
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
    selectedVariation = null;
}

function directOrder(p) {
    if (storeClosed) {
        showStoreWarning(() => {
            proceedDirectOrder(p);
        });
        return;
    }
    proceedDirectOrder(p);
}

function proceedDirectOrder(p) {
    // If product has variations and none selected, show detail
    if (p.variations && p.variations.length > 0 && !selectedVariation) {
        showDetail(p);
        return;
    }

    const itemToAdd = { ...p };
    if (selectedVariation) {
        itemToAdd.selectedVariation = selectedVariation;
        itemToAdd.harga = selectedVariation.harga;
        itemToAdd.sku = selectedVariation.sku;
        itemToAdd.stok = selectedVariation.stok;
        const gajianInfo = calculateGajianPrice(selectedVariation.harga);
        itemToAdd.hargaGajian = gajianInfo.price;
    }

    cart = [{ ...itemToAdd, qty: 1 }];
    saveCart();
    updateCartUI();
    openOrderModal();
    selectedVariation = null;
}

function directOrderFromModal() {
    const name = document.getElementById('modal-product-name').innerText;
    const product = allProducts.find(p => p.nama === name);
    if (product) {
        directOrder(product);
        closeDetailModal();
    }
}

// ============ STORE CLOSED LOGIC ============
function checkStoreStatus() {
    storeClosed = CONFIG.isStoreClosed();
    const banner = document.getElementById('store-closed-banner');
    const header = document.getElementById('main-header');
    
    if (storeClosed) {
        if (banner) banner.classList.remove('hidden');
        if (header) header.style.top = '36px';
        
        // Show modal only once per session
        if (!sessionStorage.getItem('store_closed_modal_shown')) {
            setTimeout(() => {
                document.getElementById('store-closed-modal').classList.remove('hidden');
                sessionStorage.setItem('store_closed_modal_shown', 'true');
            }, 1000);
        }
    } else {
        if (banner) banner.classList.add('hidden');
        if (header) header.style.top = '0';
    }
}

function closeStoreClosedModal() {
    document.getElementById('store-closed-modal').classList.add('hidden');
}

function showStoreWarning(onConfirm) {
    const modal = document.getElementById('store-warning-modal');
    const confirmBtn = document.getElementById('confirm-store-warning');
    
    modal.classList.remove('hidden');
    
    // Use a new function to avoid multiple event listeners
    confirmBtn.onclick = () => {
        modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    };
}

function closeStoreWarningModal() {
    document.getElementById('store-warning-modal').classList.add('hidden');
}

function openOrderModal() {
    if (cart.length === 0) return;
    
    closeCartModal();
    
    // Update Order Summary
    const summaryEl = document.getElementById('order-summary');
    const payEl = document.querySelector('input[name="pay-method"]:checked');
    const isGajian = payEl && payEl.value === 'Bayar Gajian';
    
    if (summaryEl) {
        let totalPoints = 0;
        summaryEl.innerHTML = cart.map(item => {
            const price = isGajian ? item.hargaGajian : item.harga;
            const effectivePrice = calculateTieredPrice(price, item.qty, item.grosir);
            const isGrosir = effectivePrice < price;
            
            // Points are always calculated based on the base cash price for fairness
            // Use variation price for points if it's a variant
            const itemPoints = calculateRewardPoints(item.harga, item.nama) * item.qty;
            totalPoints += itemPoints;
            return `
                <div class="flex justify-between items-center py-1">
                    <div class="flex flex-col">
                        <span class="font-medium">${item.nama}${item.selectedVariation ? ' (' + item.selectedVariation.nama + ')' : ''} (x${item.qty})</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                +${itemPoints.toFixed(1)} Poin
                            </span>
                            ${isGrosir ? '<span class="bg-green-100 text-green-700 text-[8px] px-1 rounded font-bold">Harga Grosir</span>' : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-end">
                        ${isGrosir ? `<span class="text-[10px] text-gray-400 line-through">Rp ${(price * item.qty).toLocaleString('id-ID')}</span>` : ''}
                        <span class="font-bold">Rp ${(effectivePrice * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add total points to summary
        summaryEl.innerHTML += `
            <div class="border-t border-dashed border-gray-200 mt-2 pt-2 flex justify-between items-center">
                <span class="text-xs font-bold text-amber-700">Total Poin Didapat:</span>
                <span class="text-sm font-black text-amber-700 flex items-center gap-1">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    ${totalPoints.toFixed(1)} Poin
                </span>
            </div>
        `;
    }
    
    updateOrderTotal();

    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
    }
}

function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}

function shareProduct(name) {
    const text = `Cek paket sembako murah "${name}" di GoSembako! Kualitas terjamin, harga bersahabat.`;
    const url = window.location.href;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(waUrl, '_blank');
}

function startNotificationLoop() {
    const names = ['Siti', 'Budi', 'Ani', 'Joko', 'Rina', 'Agus', 'Dewi', 'Eko'];
    const products = allProducts.length > 0 ? allProducts.map(p => p.nama) : ['Paket Sembako'];
    
    setInterval(() => {
        if (Math.random() > 0.7) {
            const name = names[Math.floor(Math.random() * names.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            showNotification(`${name} baru saja membeli ${product}`);
        }
    }, 15000);
}

function showNotification(text) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-4 bg-white/90 backdrop-blur shadow-lg rounded-xl p-3 flex items-center gap-3 border border-green-100 z-50 animate-bounce';
    toast.innerHTML = `
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"></path></svg>
        </div>
        <p class="text-xs font-medium text-gray-700">${text}</p>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchTukarPoin();

    // Add event listener for detail modal add to cart button
    const modalAddCartBtn = document.getElementById('modal-add-cart');
    if (modalAddCartBtn) {
        modalAddCartBtn.addEventListener('click', (event) => {
            const name = document.getElementById('modal-product-name').innerText;
            const product = allProducts.find(p => p.nama === name);
            if (product) {
                const qtyInput = document.getElementById('modal-qty');
                const qty = qtyInput ? parseInt(qtyInput.value) : 1;
                addToCart(product, event, qty);
                closeDetailModal();
            }
        });
    }
});

function toggleLocationField() {
    const shipEl = document.querySelector('input[name="ship-method"]:checked');
    const locationField = document.getElementById('location-field');
    const deliveryUI = document.getElementById('delivery-location-ui');
    const pickupUI = document.getElementById('pickup-location-ui');
    
    if (shipEl) {
        if (shipEl.value === 'Antar Nikomas') {
            locationField.classList.remove('hidden');
            deliveryUI.classList.remove('hidden');
            pickupUI.classList.add('hidden');
        } else {
            locationField.classList.remove('hidden');
            deliveryUI.classList.add('hidden');
            pickupUI.classList.remove('hidden');
        }
    }
    updateOrderTotal();
}

function updateOrderTotal() {
    const payEl = document.querySelector('input[name="pay-method"]:checked');
    const shipEl = document.querySelector('input[name="ship-method"]:checked');
    const isGajian = payEl && payEl.value === 'Bayar Gajian';
    const isDelivery = shipEl && shipEl.value === 'Antar Nikomas';
    
    let subtotal = 0;
    cart.forEach(item => {
        const price = isGajian ? item.hargaGajian : item.harga;
        const effectivePrice = calculateTieredPrice(price, item.qty, item.grosir);
        subtotal += effectivePrice * item.qty;
    });
    
    const shippingFee = isDelivery ? 2000 : 0;
    const total = subtotal + shippingFee;
    
    // Update the display elements
    const totalEl = document.getElementById('sticky-order-total');
    if (totalEl) {
        totalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    }
    
    // Also update subtotal and shipping if they exist in the UI
    const subtotalEl = document.getElementById('order-subtotal');
    const shippingEl = document.getElementById('order-shipping');
    if (subtotalEl) subtotalEl.innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    if (shippingEl) shippingEl.innerText = `Rp ${shippingFee.toLocaleString('id-ID')}`;
}

function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.toString().replace(/[^0-9]/g, '');
    if (p.startsWith('62')) p = '0' + p.slice(2);
    else if (p.startsWith('8')) p = '0' + p;
    else if (!p.startsWith('0')) p = '0' + p;
    
    // Ensure it starts with 08 for mobile numbers
    if (p.startsWith('0') && !p.startsWith('08') && p.length > 1) {
        // Optional: handle other prefixes if needed
    }
    return p;
}

function generateOrderId() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${result}`;
}

function sendToWA() {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const payMethod = document.querySelector('input[name="pay-method"]:checked')?.value;
    const shipMethod = document.querySelector('input[name="ship-method"]:checked')?.value;
    
    if (!name || !phone || !payMethod || !shipMethod) {
        alert('Mohon lengkapi semua data pesanan.');
        return;
    }
    
    let location = '';
    if (shipMethod === 'Antar Nikomas') {
        location = 'Antar Nikomas (Area PT Nikomas Gemilang)';
    } else if (shipMethod === 'Antar Kerumah') {
        location = 'Antar Kerumah (Area Serang & sekitarnya)';
    } else {
        location = 'Ambil Ditempat (Kp. Baru, Kec. Kibin)';
    }
    
    const isGajian = payMethod === 'Bayar Gajian';
    let total = 0;
    let totalQty = 0;
    let itemsText = '';
    let itemsForSheet = '';
    
    cart.forEach((item, idx) => {
        const price = isGajian ? item.hargaGajian : item.harga;
        const effectivePrice = calculateTieredPrice(price, item.qty, item.grosir);
        const isGrosir = effectivePrice < price;
        const itemTotal = effectivePrice * item.qty;
        total += itemTotal;
        totalQty += item.qty;
        
        const variationText = item.selectedVariation ? ` (${item.selectedVariation.nama})` : '';
        const grosirText = isGrosir ? ` (Harga Grosir: Rp ${effectivePrice.toLocaleString('id-ID')}/unit)` : '';
        itemsText += `${idx + 1}. ${item.nama}${variationText} x${item.qty}${grosirText} = Rp ${itemTotal.toLocaleString('id-ID')}\n`;
        itemsForSheet += `${item.nama}${variationText} (x${item.qty}) | `;
    });
    
    const shippingFee = shipMethod === 'Antar Nikomas' ? 2000 : 0;
    total += shippingFee;
    
    // Calculate reward points (1 point per 10,000 IDR)
    const rewardConfig = CONFIG.getRewardConfig();
    const pointValue = rewardConfig.pointValue || 10000;
    const pointsEarned = Math.floor(total / pointValue);
    
    const orderId = generateOrderId();
    
    const message = `*PESANAN BARU - GOSEMBAKO*\n\n` +
        `*Order ID: ${orderId}*\n` +
        `*Data Pelanggan:*\n` +
        `Nama: ${name}\n` +
        `WhatsApp: ${phone}\n\n` +
        `*Detail Pesanan:*\n${itemsText}\n` +
        `*Metode Pembayaran:* ${payMethod}\n` +
        `*Metode Pengiriman:* ${shipMethod}\n` +
        `*Lokasi/Titik:* ${location}\n\n` +
        `*Ongkir:* Rp ${shippingFee.toLocaleString('id-ID')}\n` +
        `*TOTAL BAYAR: Rp ${total.toLocaleString('id-ID')}*\n` +
        `*Estimasi Poin:* +${pointsEarned} Poin\n\n` +
        `Mohon segera diproses ya, terima kasih!`;
        
    const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(message)}`;
    
    // Log order to spreadsheet before opening WhatsApp
    // Mapping to spreadsheet columns: id, pelanggan, produk, qty, total, status, tanggal, phone, poin, point_processed
    const orderData = {
        id: orderId,
        pelanggan: name,
        produk: itemsForSheet.slice(0, -3), // Remove trailing ' | '
        qty: totalQty,
        total: total,
        status: 'Pending',
        tanggal: new Date().toLocaleString('id-ID'),
        phone: normalizePhone(phone),
        poin: pointsEarned,
        point_processed: 'No'
    };

    fetch(`${API_URL}?sheet=orders`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([orderData])
    })
    .then(res => res.json())
    .then(data => {
        console.log('Order logged to spreadsheet:', data);
    })
    .catch(err => {
        console.error('Error logging order:', err);
    })
    .finally(() => {
        window.open(waUrl, '_blank');
        
        // Clear cart after order
        cart = [];
        saveCart();
        updateCartUI();
        closeOrderModal();
        showToast('Pesanan berhasil dikirim!');
    });
}

function handleLogoClick() {
    // Hidden admin access: click logo 5 times
    let clicks = parseInt(sessionStorage.getItem('logo_clicks') || 0) + 1;
    sessionStorage.setItem('logo_clicks', clicks);
    if (clicks >= 5) {
        sessionStorage.setItem('logo_clicks', 0);
        window.location.href = 'admin/login.html';
    }
    setTimeout(() => sessionStorage.setItem('logo_clicks', 0), 3000);
}

// ============ REWARD MODAL FUNCTIONS ============
async function fetchTukarPoin() {
    const rewardList = document.getElementById('reward-items-list');
    if (!rewardList) return;

    try {
        const response = await fetch(`${API_URL}?sheet=tukar_poin`);
        if (!response.ok) throw new Error('Network response was not ok');
        const rewards = await response.json();
        renderRewardItems(rewards);
    } catch (error) {
        console.error('Error fetching reward items:', error);
        rewardList.innerHTML = `
            <div class="text-center py-6 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
                <p class="text-xs text-red-600 font-semibold">Gagal memuat hadiah. Silakan coba lagi nanti.</p>
            </div>
        `;
    }
}

function renderRewardItems(rewards) {
    const rewardList = document.getElementById('reward-items-list');
    if (!rewardList) return;

    if (!rewards || rewards.length === 0) {
        rewardList.innerHTML = `
            <div class="text-center py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                <p class="text-sm text-gray-600 font-semibold">Belum ada hadiah yang tersedia.</p>
            </div>
        `;
        return;
    }

    rewardList.innerHTML = rewards.map(r => {
        const id = r.id || '';
        const nama = r.nama || r.judul || 'Hadiah';
        const poin = r.poin || 0;
        const gambar = r.gambar || 'https://via.placeholder.com/100?text=Reward';
        const deskripsi = r.deskripsi || '';

        return `
            <div class="bg-white p-4 rounded-2xl border-2 border-gray-100 hover:border-green-500 transition-all group shadow-sm">
                <div class="flex gap-4">
                    <div class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src="${gambar}" alt="${nama}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h5 class="font-bold text-gray-800 truncate">${nama}</h5>
                        <p class="text-[10px] text-gray-500 line-clamp-2 mb-2">${deskripsi}</p>
                        <div class="flex items-center justify-between">
                            <div class="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                ${poin} Poin
                            </div>
                            <button onclick="claimReward('${id}')" class="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95">
                                Tukar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openRewardModal() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
        fetchTukarPoin();
    }
}

function closeRewardModal() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}

/**
 * Check user points from SheetDB
 * Fetches points data based on phone number
 */
function checkUserPoints() {
    const phoneInput = document.getElementById('reward-phone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    
    if (!phone) {
        alert('Mohon masukkan nomor WhatsApp.');
        return;
    }

    const normalizedPhone = normalizePhone(phone);
    const apiUrl = `${API_URL}?sheet=user_points`;

    // Show loading state
    const checkBtn = event.target;
    const originalText = checkBtn ? checkBtn.innerText : 'Cek Poin';
    if (checkBtn && checkBtn.tagName === 'BUTTON') {
        checkBtn.innerText = 'Mencari...';
        checkBtn.disabled = true;
    }

    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            // Find user by normalized phone
            // Fix: API uses 'phone' field, not 'whatsapp'
            const user = data.find(r => normalizePhone(r.phone || r.whatsapp || '') === normalizedPhone);

            const display = document.getElementById('points-display');
            const value = document.querySelector('#points-display h4');

            if (user) {
                // Fix: Handle comma as decimal separator from spreadsheet
                const rawPoints = (user.points || user.poin || '0').toString().replace(',', '.');
                const pts = parseFloat(rawPoints) || 0;
                value.innerHTML = `${pts.toFixed(1)} <span class="text-sm font-bold">Poin</span>`;
                sessionStorage.setItem('user_points', pts);
                sessionStorage.setItem('reward_phone', normalizedPhone);
                showToast(`Ditemukan ${pts.toFixed(1)} poin untuk nomor ini!`);
            } else {
                value.innerHTML = `0.0 <span class="text-sm font-bold">Poin</span>`;
                sessionStorage.setItem('user_points', 0);
                sessionStorage.setItem('reward_phone', normalizedPhone);
                showToast('Nomor tidak ditemukan atau belum memiliki poin.');
            }
            display.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error checking points:', error);
            alert('Gagal mengecek poin. Silakan coba lagi.');
        })
        .finally(() => {
            if (checkBtn && checkBtn.tagName === 'BUTTON') {
                checkBtn.innerText = originalText;
                checkBtn.disabled = false;
            }
        });
}

/**
 * Claim reward
 */
function claimReward(rewardId) {
    const phone = sessionStorage.getItem('reward_phone');
    const points = parseFloat(sessionStorage.getItem('user_points')) || 0;
    
    if (!phone) {
        alert('Mohon cek poin Anda terlebih dahulu.');
        return;
    }
    
    if (points <= 0) {
        alert('Anda tidak memiliki poin untuk ditukar.');
        return;
    }
    
    // Show confirmation
    const message = `Tukar poin Anda (${points.toFixed(1)} poin) dengan reward ini?`;
    if (confirm(message)) {
        // Send to WhatsApp for manual processing
        const waMessage = `*KLAIM REWARD POIN*\n\nNomor WhatsApp: ${phone}\nTotal Poin: ${points.toFixed(1)} Poin\nReward ID: ${rewardId}\n\nMohon proses klaim reward saya.`;
        const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank');
        
        showToast('Permintaan klaim reward telah dikirim ke WhatsApp admin!');
    }
}
