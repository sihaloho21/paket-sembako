let API_URL = CONFIG.getMainApiUrl();
let cart = JSON.parse(localStorage.getItem('sembako_cart')) || [];
let allProducts = [];
let currentCategory = 'Semua';

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
            
            return {
                ...p,
                harga: cashPrice,
                hargaGajian: gajianInfo.price,
                stok: parseInt(p.stok) || 0,
                category: category,
                deskripsi: (p.deskripsi && p.deskripsi.trim() !== "") ? p.deskripsi : defaultDesc
            };
        });
        renderProducts(allProducts);
        updateCartUI();
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
        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 relative">
                <div class="absolute top-3 left-3 z-10">
                    <div class="bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        +${rewardPoints} Poin
                    </div>
                </div>
                <img src="${mainImage}" alt="${p.nama}" class="w-full h-48 object-cover ${p.stok === 0 ? 'grayscale opacity-60' : ''}" onerror="this.src='https://via.placeholder.com/300x200?text=Produk'">
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
                            <p class="text-lg font-bold text-green-700">Rp ${p.harga.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <p class="text-[10px] text-blue-600 font-bold uppercase">Bayar Gajian</p>
                            <p class="text-lg font-bold text-blue-700">Rp ${p.hargaGajian.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <button onclick='addToCart(${pData}, event)' ${p.stok === 0 ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-3">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Tambah ke Keranjang
                    </button>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick='showDetail(${pData})' class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 rounded-lg text-sm transition">Rincian</button>
                        <button onclick='directOrder(${pData})' ${p.stok === 0 ? 'disabled' : ''} class="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 rounded-lg text-sm transition">Beli Sekarang</button>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-4 text-center italic">Diantar Nikomas - Diantar Kerumah - Ambil Ditempat</p>
                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = allProducts.filter(p => {
        const matchSearch = p.nama.toLowerCase().includes(query);
        const matchCategory = currentCategory === 'Semua' || p.category === currentCategory;
        return matchSearch && matchCategory;
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

function addToCart(p, event) {
    const existing = cart.find(item => item.nama === p.nama);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...p, qty: 1 });
    }
    saveCart();
    updateCartUI();
    
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
    showToast(`${p.nama} ditambahkan ke keranjang`);
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
            total += item.harga * item.qty;
            const images = item.gambar ? item.gambar.split(',') : [];
            const mainImage = images[0] || 'https://via.placeholder.com/100x100?text=Produk';
            return `
                <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
                    <img src="${mainImage}" class="w-16 h-16 object-cover rounded-lg">
                    <div class="flex-1">
                        <h5 class="font-bold text-gray-800 text-sm">${item.nama}</h5>
                        <p class="text-green-600 font-bold text-xs">Rp ${item.harga.toLocaleString('id-ID')}</p>
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

function showDetail(p) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    const nameEl = document.getElementById('modal-product-name');
    const imageEl = document.getElementById('modal-product-image');
    const cashPriceEl = document.getElementById('modal-cash-price');
    const gajianPriceEl = document.getElementById('modal-gajian-price');
    const itemsListEl = document.getElementById('modal-items-list');
    const badgesEl = document.getElementById('modal-badges');
    const savingsHighlight = document.getElementById('savings-highlight');
    const savingsAmount = document.getElementById('savings-amount');

    if (nameEl) nameEl.innerText = p.nama;
    if (cashPriceEl) cashPriceEl.innerText = `Rp ${p.harga.toLocaleString('id-ID')}`;
    if (gajianPriceEl) gajianPriceEl.innerText = `Rp ${p.hargaGajian.toLocaleString('id-ID')}`;
    
    if (badgesEl) {
        const rewardPoints = calculateRewardPoints(p.harga, p.nama);
        badgesEl.innerHTML = `
            <span class="bg-green-100 text-green-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">${p.category}</span>
            <span class="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                +${rewardPoints} Poin Reward
            </span>
        `;
    }

    if (savingsHighlight && savingsAmount) {
        const savings = Math.round(p.harga * 0.15); // Example savings calculation
        savingsAmount.innerText = `Rp ${savings.toLocaleString('id-ID')}`;
        savingsHighlight.classList.remove('hidden');
    }

    if (imageEl) {
        const images = p.gambar ? p.gambar.split(',') : [];
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

    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}

function directOrder(p) {
    cart = [{ ...p, qty: 1 }];
    saveCart();
    updateCartUI();
    openOrderModal();
}

function directOrderFromModal() {
    const name = document.getElementById('modal-product-name').innerText;
    const product = allProducts.find(p => p.nama === name);
    if (product) {
        directOrder(product);
        closeDetailModal();
    }
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
            // Points are always calculated based on the base cash price for fairness
            const itemPoints = calculateRewardPoints(item.harga, item.nama) * item.qty;
            totalPoints += itemPoints;
            return `
                <div class="flex justify-between items-center py-1">
                    <div class="flex flex-col">
                        <span class="font-medium">${item.nama} (x${item.qty})</span>
                        <span class="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            +${itemPoints.toFixed(1)} Poin
                        </span>
                    </div>
                    <span class="font-bold">Rp ${(price * item.qty).toLocaleString('id-ID')}</span>
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
    const text = `Cek paket sembako murah "${name}" di Harapan Jaya! Kualitas terjamin, harga bersahabat.`;
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

    // Add event listener for detail modal add to cart button
    const modalAddCartBtn = document.getElementById('modal-add-cart');
    if (modalAddCartBtn) {
        modalAddCartBtn.addEventListener('click', (event) => {
            const name = document.getElementById('modal-product-name').innerText;
            const product = allProducts.find(p => p.nama === name);
            if (product) {
                addToCart(product, event);
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
        if (locationField) locationField.classList.remove('hidden');
        if (shipEl.value === 'Diantar Kerumah') {
            if (deliveryUI) deliveryUI.classList.remove('hidden');
            if (pickupUI) pickupUI.classList.add('hidden');
        } else if (shipEl.value === 'Ambil Ditempat') {
            if (deliveryUI) deliveryUI.classList.add('hidden');
            if (pickupUI) pickupUI.classList.remove('hidden');
            const locLink = document.getElementById('location-link');
            if (locLink) locLink.value = "https://maps.app.goo.gl/JExkrRvR5PBah9oaA";
        } else {
            if (locationField) locationField.classList.add('hidden');
            const locLink = document.getElementById('location-link');
            if (locLink) locLink.value = "";
        }
    } else {
        if (locationField) locationField.classList.add('hidden');
    }
}

function getCurrentLocation() {
    const btn = document.getElementById('get-location-btn');
    const originalText = '<span>📍 Bagikan Lokasi Saya</span>';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⌛ Mencari Lokasi...</span>';
    }

    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung oleh browser Anda.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
            const locLink = document.getElementById('location-link');
            if (locLink) locLink.value = mapsUrl;
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-200');
                btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                btn.innerHTML = '<span>✅ Lokasi Berhasil Dibagikan</span>';
            }
        },
        (error) => {
            let msg = "Gagal mengambil lokasi.";
            if (error.code === 1) msg = "Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.";
            alert(msg);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateOrderTotal() {
    const payEl = document.querySelector('input[name="pay-method"]:checked');
    const isGajian = payEl && payEl.value === 'Bayar Gajian';
    
    const total = cart.reduce((sum, item) => {
        const price = isGajian ? item.hargaGajian : item.harga;
        return sum + (price * item.qty);
    }, 0);
    
    const finalTotalEl = document.getElementById('order-final-total');
    if (finalTotalEl) finalTotalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
    
    const stickyTotalEl = document.getElementById('sticky-order-total');
    if (stickyTotalEl) stickyTotalEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;

    // Also update summary if modal is open
    const summaryEl = document.getElementById('order-summary');
    if (summaryEl && document.getElementById('order-modal').classList.contains('hidden') === false) {
        let totalPoints = 0;
        summaryEl.innerHTML = cart.map(item => {
            const price = isGajian ? item.hargaGajian : item.harga;
            // Points are always calculated based on the base cash price for fairness
            const itemPoints = calculateRewardPoints(item.harga, item.nama) * item.qty;
            totalPoints += itemPoints;
            return `
                <div class="flex justify-between items-center py-1">
                    <div class="flex flex-col">
                        <span class="font-medium">${item.nama} (x${item.qty})</span>
                        <span class="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            +${itemPoints.toFixed(1)} Poin
                        </span>
                    </div>
                    <span class="font-bold">Rp ${(price * item.qty).toLocaleString('id-ID')}</span>
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
}

function showQRISModal() {
    const modal = document.getElementById('qris-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeQRISModal() {
    const modal = document.getElementById('qris-modal');
    if (modal) modal.classList.add('hidden');
}

function sendToWA() {
    const name = document.getElementById('customer-name').value.trim();
    const shipEl = document.querySelector('input[name="ship-method"]:checked');
    const payEl = document.querySelector('input[name="pay-method"]:checked');
    const locationLink = document.getElementById('location-link').value.trim();

    if (!shipEl || !payEl) {
        alert("Silakan pilih metode pengiriman dan pembayaran terlebih dahulu!");
        return;
    }

    const ship = shipEl.value;
    const pay = payEl.value;
    
    if (ship === 'Diantar Kerumah' && !locationLink) {
        alert("Silakan bagikan lokasi Anda terlebih dahulu!");
        return;
    }

    const isGajian = pay === 'Bayar Gajian';
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    const dateStr = nowWIB.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let itemDetails = "";
    let grandTotal = 0;
    let totalPoints = 0;

    cart.forEach((item, index) => {
        const price = isGajian ? item.hargaGajian : item.harga;
        const subtotal = price * item.qty;
        // Points are always calculated based on the base cash price for fairness
        const itemPoints = calculateRewardPoints(item.harga, item.nama) * item.qty;
        grandTotal += subtotal;
        totalPoints += itemPoints;
        itemDetails += `${index + 1}. ${item.nama} (x${item.qty})\n   Harga: Rp ${price.toLocaleString('id-ID')}\n   Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n   Poin: +${itemPoints.toFixed(1)}\n`;
    });
    
    let locationInfo = "";
    if (locationLink) {
        locationInfo = `*Link Lokasi:* ${locationLink}\n`;
    }

    const rawPhone = document.getElementById('customer-phone') ? document.getElementById('customer-phone').value : '';
    const phone = normalizePhone(rawPhone);
    
    const message = `*PESANAN BARU - HARAPAN JAYA*
------------------------------------------
*Tanggal Pemesanan:* ${dateStr}
*Atas Nama:* ${name || '-'}
*No. WA:* ${phone || '-'}
*Metode Bayar:* ${pay}
*Pengiriman:* ${ship}
${locationInfo}
*Daftar Belanja:*
${itemDetails}
------------------------------------------
*TOTAL BAYAR: Rp ${grandTotal.toLocaleString('id-ID')}*
*POIN DIDAPAT: +${totalPoints.toFixed(1)} Poin*

Mohon segera diproses, terima kasih!`;

    const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(message)}`;

    // Record order to SheetDB
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const orderData = {
        id: orderId,
        pelanggan: name || 'Pelanggan',
        phone: phone,
        produk: cart.map(item => `${item.nama} (x${item.qty})`).join(', '),
        qty: cart.reduce((sum, item) => sum + item.qty, 0),
        total: grandTotal,
        poin: totalPoints.toFixed(1),
        status: 'Menunggu',
        tanggal: dateStr,
        points_awarded: 'Tidak'
    };

    const submitBtn = document.querySelector('button[onclick="sendToWA()"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⌛ Memproses Pesanan...</span>';
    }

    fetch(`${API_URL}?sheet=orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: orderData })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Order recorded:', result);
        window.open(waUrl, '_blank');
        cart = [];
        saveCart();
        updateCartUI();
        closeOrderModal();
    })
    .catch(error => {
        console.error('Error recording order:', error);
        // Still open WA even if recording fails, but alert the user
        window.open(waUrl, '_blank');
        cart = [];
        saveCart();
        updateCartUI();
        closeOrderModal();
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    });
}

// ============ REWARD SYSTEM FUNCTIONS ============
function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.toString().replace(/[^0-9]/g, '');
    if (p.startsWith('62')) p = '0' + p.slice(2);
    else if (p.startsWith('8')) p = '0' + p;
    else if (!p.startsWith('0')) p = '0' + p;
    
    // Ensure it starts with 08
    if (p.startsWith('0') && !p.startsWith('08') && p.length > 1) {
        // For mobile numbers in Indonesia
    }
    return p;
}

function openRewardModal() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');
        
        // Auto-fill phone if available in order form
        const orderPhone = document.getElementById('customer-phone');
        const rewardPhone = document.getElementById('reward-phone');
        if (orderPhone && rewardPhone && orderPhone.value && !rewardPhone.value) {
            rewardPhone.value = orderPhone.value;
        }
        
        fetchRewardItems();
    }
}

function closeRewardModal() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }
}

let userPointsBalance = 0;
let userPhoneForReward = '';

async function fetchRewardItems() {
    const container = document.getElementById('reward-items-list');
    if (!container) return;

    try {
        const API_URL = CONFIG.getMainApiUrl();
        // Use 'tukar_poin' sheet as configured in admin
        const response = await fetch(`${API_URL}?sheet=tukar_poin`);
        const rewards = await response.json();

        if (!Array.isArray(rewards) || rewards.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p class="text-sm text-gray-500">Belum ada hadiah yang tersedia.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = rewards.map(item => {
            const cost = parseInt(item.poin) || 0;
            const canClaim = userPointsBalance >= cost && userPhoneForReward !== '';
            const title = item.judul || item.nama; // Support both 'judul' (new) and 'nama' (old)
            
            return `
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <img src="${item.gambar || 'https://via.placeholder.com/60?text=Gift'}" alt="${title}" class="w-16 h-16 object-cover rounded-lg bg-gray-50">
                    <div class="flex-1">
                        <h5 class="font-bold text-gray-800 text-sm">${title}</h5>
                        <p class="text-amber-600 font-bold text-xs">${cost} Poin</p>
                    </div>
                    <button 
                        onclick="claimReward('${title}', ${cost}, event)" 
                        ${!canClaim ? 'disabled' : ''}
                        class="px-4 py-2 rounded-lg font-bold text-xs transition ${canClaim ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
                    >
                        Tukar
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error fetching rewards:', error);
        container.innerHTML = '<p class="text-center py-4 text-red-500 text-xs">Gagal memuat daftar hadiah.</p>';
    }
}

async function checkUserPoints() {
    const phoneInput = document.getElementById('reward-phone');
    const phone = phoneInput.value.trim();
    if (!phone) {
        alert('Silakan masukkan nomor WhatsApp Anda.');
        return;
    }

    userPhoneForReward = phone;
    const display = document.getElementById('points-display');
    display.classList.remove('hidden');
    display.innerHTML = `
        <div class="flex items-center gap-3 py-2">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
            <p class="text-xs text-amber-600">Mencari data...</p>
        </div>
    `;

    try {
        const API_URL = CONFIG.getAdminApiUrl();
        const normalizedSearchPhone = normalizePhone(phone);
        
        // Fetch from user_points sheet
        const response = await fetch(`${API_URL}/search?sheet=user_points&phone=${normalizedSearchPhone}`);
        const userData = await response.json();
        
        if (Array.isArray(userData) && userData.length > 0) {
            userPointsBalance = parseFloat(userData[0].points) || 0;
        } else {
            userPointsBalance = 0;
        }

        display.innerHTML = `
            <p class="text-xs text-amber-600 font-medium">Total Poin Anda:</p>
            <h4 class="text-3xl font-black text-amber-700">${userPointsBalance.toFixed(1)} <span class="text-sm font-bold">Poin</span></h4>
            <p class="text-[10px] text-gray-400 mt-1 italic">*Saldo poin terpusat untuk kemudahan Anda.</p>
        `;

        // Refresh reward items to enable/disable buttons based on new balance
        fetchRewardItems();
    } catch (error) {
        console.error('Error checking points:', error);
        display.innerHTML = `
            <p class="text-xs text-red-500 font-medium">Gagal mengambil data. Silakan coba lagi.</p>
        `;
    }
}

async function claimReward(rewardName, pointCost, event) {
    if (userPointsBalance < pointCost) {
        alert('Poin Anda tidak mencukupi untuk menukarkan hadiah ini.');
        return;
    }

    const userName = prompt('Masukkan nama Anda untuk konfirmasi klaim:') || 'Pelanggan';
    
    const message = `*KLAIM HADIAH - HARAPAN JAYA*
--------------------------------
Halo Admin, saya ingin menukarkan poin saya.

*Nama:* ${userName}
*No. WA:* ${userPhoneForReward}
*Hadiah:* ${rewardName}
*Poin Ditukar:* ${pointCost} Poin
--------------------------------
Mohon diproses penukarannya, terima kasih!`;

    const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(message)}`;
    
    // Record claim to SheetDB
    const API_URL = CONFIG.getAdminApiUrl();
    const claimData = {
        id: 'CLM-' + Date.now().toString().slice(-6),
        phone: userPhoneForReward,
        pelanggan: userName,
        hadiah: rewardName,
        poin: pointCost,
        status: 'Menunggu',
        tanggal: new Date().toLocaleString('id-ID')
    };

    // Show loading state on the button
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '...';

    try {
        // 1. Record claim to SheetDB
        const response = await fetch(`${API_URL}?sheet=claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: claimData })
        });

        if (response.ok) {
            // 2. Deduct points from user_points sheet
            const normalizedPhone = normalizePhone(userPhoneForReward);
            const newBalance = userPointsBalance - pointCost;
            
            await fetch(`${API_URL}/phone/${normalizedPhone}?sheet=user_points`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    data: { 
                        points: newBalance,
                        last_updated: new Date().toLocaleString('id-ID')
                    } 
                })
            });

            window.open(waUrl, '_blank');
            showToast(`Permintaan klaim ${rewardName} telah dikirim!`);
            
            // Update local balance and UI
            userPointsBalance = newBalance;
            const display = document.getElementById('points-display');
            if (display) {
                const h4 = display.querySelector('h4');
                if (h4) h4.innerHTML = `${userPointsBalance.toFixed(1)} <span class="text-sm font-bold">Poin</span>`;
            }
            fetchRewardItems();
        } else {
            throw new Error('Gagal mengirim data klaim');
        }
    } catch (err) {
        console.error('Error recording claim:', err);
        alert('Gagal memproses klaim. Silakan periksa koneksi internet Anda.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
