const API_URL = 'https://sheetdb.io/api/v1/rga3iyvladqlc';
let cart = JSON.parse(localStorage.getItem('sembako_cart')) || [];
let allProducts = [];
let currentCategory = 'Semua';

function calculateGajianPrice(cashPrice) {
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    let targetDate = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), 7);
    if (nowWIB.getDate() > 7) targetDate.setMonth(targetDate.getMonth() + 1);
    const diffTime = targetDate - nowWIB;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let markup = 0.25;
    if (diffDays <= 2) markup = 0.01;
    else if (diffDays <= 3) markup = 0.03;
    else if (diffDays <= 4) markup = 0.04;
    else if (diffDays <= 5) markup = 0.05;
    else if (diffDays <= 7) markup = 0.06;
    else if (diffDays <= 10) markup = 0.07;
    else if (diffDays <= 15) markup = 0.10;
    else if (diffDays <= 20) markup = 0.15;
    else if (diffDays <= 29) markup = 0.20;
    return {
        price: Math.round(cashPrice * (1 + markup)),
        daysLeft: diffDays,
        markupPercent: (markup * 100).toFixed(0)
    };
}

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        allProducts = products.map(p => {
            const cashPrice = parseInt(p.harga);
            const gajianInfo = calculateGajianPrice(cashPrice);
            
            // Determine category based on price or name (logic can be adjusted)
            let category = 'Bahan Pokok';
            if (cashPrice >= 150000) category = 'Paket Lengkap';
            else if (cashPrice >= 50000) category = 'Paket Hemat';
            
            return {
                ...p,
                harga: cashPrice,
                hargaGajian: gajianInfo.price,
                stok: parseInt(p.stok) || 0,
                category: category,
                deskripsi: p.deskripsi || "Kualitas Terjamin,Stok Selalu Baru,Harga Kompetitif"
            };
        });
        renderProducts(allProducts);
        updateCartUI();
        startNotificationLoop();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('product-grid').innerHTML = '<p class="text-center col-span-full text-red-500">Gagal memuat produk. Silakan coba lagi nanti.</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
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

        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 relative">
                <img src="${p.gambar}" alt="${p.nama}" class="w-full h-48 object-cover ${p.stok === 0 ? 'grayscale opacity-60' : ''}" onerror="this.src='https://via.placeholder.com/300x200?text=Produk'">
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
                    <button onclick='addToCart(${pData})' ${p.stok === 0 ? 'disabled' : ''} class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mb-3">
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

function addToCart(p) {
    const existing = cart.find(item => item.nama === p.nama);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...p, qty: 1 });
    }
    saveCart();
    updateCartUI();
    
    // Animation
    const btn = document.querySelector('header button');
    btn.classList.add('cart-bounce');
    setTimeout(() => btn.classList.remove('cart-bounce'), 500);
}

function saveCart() {
    localStorage.setItem('sembako_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const countEls = [document.getElementById('cart-count'), document.getElementById('cart-count-float')];
    
    countEls.forEach(el => {
        if (el) {
            if (count > 0) {
                el.innerText = count;
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    const itemsContainer = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    const empty = document.getElementById('cart-empty');

    if (cart.length === 0) {
        itemsContainer.innerHTML = '';
        footer.classList.add('hidden');
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        footer.classList.remove('hidden');
        
        let total = 0;
        itemsContainer.innerHTML = cart.map((item, index) => {
            total += item.harga * item.qty;
            return `
                <div class="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
                    <img src="${item.gambar}" class="w-16 h-16 object-cover rounded-lg">
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
        document.getElementById('cart-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
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
    document.getElementById('cart-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function closeCartModal() {
    document.getElementById('cart-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

function shareProduct(name) {
    const title = `*Harapan Jaya – Paket Sembako Murah*`;
    const content = `Halo! Saya baru saja melihat *${name}* di Harapan Jaya. Harganya murah dan kualitasnya terjamin!`;
    const link = "Link: https://darling-dusk-76d7fb.netlify.app/";
    const closing = "Yuk cek katalog lengkapnya di sini!";
    
    const message = `${title}\n\n${content}\n\n${link}\n\n${closing}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

let sliderInterval;
let currentSlide = 0;

function showDetail(p) {
    const pData = JSON.stringify(p).replace(/"/g, '&quot;');
    
    // Set Basic Info
    document.getElementById('modal-product-name').innerText = p.nama;
    document.getElementById('modal-cash-price').innerText = `Rp ${p.harga.toLocaleString('id-ID')}`;
    document.getElementById('modal-gajian-price').innerText = `Rp ${p.hargaGajian.toLocaleString('id-ID')}`;
    
    // Set Badges
    const badgeContainer = document.getElementById('modal-badges');
    badgeContainer.innerHTML = `
        <span class="bg-green-100 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">${p.category}</span>
    `;
    if (p.stok > 5) {
        badgeContainer.innerHTML += `<span class="bg-green-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Tersedia</span>`;
    } else if (p.stok > 0) {
        badgeContainer.innerHTML += `<span class="bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Stok Terbatas</span>`;
    } else {
        badgeContainer.innerHTML += `<span class="bg-red-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Habis</span>`;
    }

    // Set Savings (Mockup logic: 5% of cash price)
    const savings = Math.round(p.harga * 0.05);
    if (savings > 0) {
        document.getElementById('savings-highlight').classList.remove('hidden');
        document.getElementById('savings-amount').innerText = `Rp ${savings.toLocaleString('id-ID')}`;
    } else {
        document.getElementById('savings-highlight').classList.add('hidden');
    }

    // Set Itemized List with Icons
    const itemsList = document.getElementById('modal-items-list');
    itemsList.innerHTML = '';
    const items = p.deskripsi.split(',');
    
    const getIcon = (item) => {
        item = item.toLowerCase();
        if (item.includes('beras')) return '📦';
        if (item.includes('minyak')) return '🧴';
        if (item.includes('mie') || item.includes('instan')) return '🍜';
        if (item.includes('gula')) return '🍬';
        if (item.includes('telur')) return '🥚';
        if (item.includes('terigu')) return '🌾';
        if (item.includes('kopi') || item.includes('teh')) return '☕';
        return '✅';
    };

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100';
        div.innerHTML = `
            <span class="text-xl">${getIcon(item)}</span>
            <span class="text-sm text-gray-700 font-medium">${item.trim()}</span>
        `;
        itemsList.appendChild(div);
    });

    // Setup Image Slider
    const slider = document.getElementById('modal-slider');
    const dotsContainer = document.getElementById('slider-dots');
    // Using multiple images if available in data, otherwise repeat main image for demo
    const images = p.images ? p.images.split(',') : [p.gambar, p.gambar, p.gambar]; 
    
    slider.innerHTML = images.map(img => `
        <img src="${img.trim()}" class="w-full h-full object-cover flex-shrink-0" onerror="this.src='https://via.placeholder.com/400x300?text=Produk'">
    `).join('');
    
    dotsContainer.innerHTML = images.map((_, i) => `
        <div class="slider-dot w-2 h-2 rounded-full bg-white/50 transition-all duration-300 ${i === 0 ? 'bg-white w-4' : ''}" data-index="${i}"></div>
    `).join('');

    // Slider Logic
    currentSlide = 0;
    const updateSlider = () => {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        document.querySelectorAll('.slider-dot').forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('bg-white', 'w-4');
                dot.classList.remove('bg-white/50');
            } else {
                dot.classList.remove('bg-white', 'w-4');
                dot.classList.add('bg-white/50');
            }
        });
    };

    const startSlider = () => {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % images.length;
            updateSlider();
        }, 3000);
    };

    startSlider();

    // Pause on interaction
    const sliderContainer = slider.parentElement;
    sliderContainer.onmouseenter = () => clearInterval(sliderInterval);
    sliderContainer.onmouseleave = startSlider;
    sliderContainer.ontouchstart = () => clearInterval(sliderInterval);
    sliderContainer.ontouchend = startSlider;

    // Set Button Actions
    const addBtn = document.getElementById('modal-add-cart');
    const buyBtn = document.getElementById('modal-buy-now');
    
    addBtn.onclick = () => {
        addToCart(p);
        closeDetailModal();
    };
    
    buyBtn.onclick = () => {
        directOrder(p);
    };

    if (p.stok === 0) {
        addBtn.disabled = true;
        addBtn.classList.add('bg-gray-300', 'cursor-not-allowed');
        buyBtn.disabled = true;
        buyBtn.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
    } else {
        addBtn.disabled = false;
        addBtn.classList.remove('bg-gray-300', 'cursor-not-allowed');
        buyBtn.disabled = false;
        buyBtn.classList.remove('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');
    }

    document.getElementById('detail-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

function directOrder(p) {
    cart = [{ ...p, qty: 1 }];
    saveCart();
    openOrderModal();
}

function openOrderModal() {
    if (cart.length === 0) return;
    
    closeCartModal();
    document.getElementById('customer-name').value = "";
    document.getElementById('location-link').value = "";
    document.querySelectorAll('input[name="ship-method"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="pay-method"]').forEach(r => r.checked = false);
    document.getElementById('location-field').classList.add('hidden');
    document.getElementById('delivery-location-ui').classList.add('hidden');
    document.getElementById('pickup-location-ui').classList.add('hidden');
    
    const summary = document.getElementById('order-summary');
    summary.innerHTML = cart.map(item => `
        <div class="flex justify-between">
            <span>${item.nama} (x${item.qty})</span>
            <span>Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</span>
        </div>
    `).join('');

    updateOrderTotal();
    document.getElementById('order-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function toggleLocationField() {
    const shipEl = document.querySelector('input[name="ship-method"]:checked');
    const locationField = document.getElementById('location-field');
    const deliveryUI = document.getElementById('delivery-location-ui');
    const pickupUI = document.getElementById('pickup-location-ui');
    
    if (shipEl) {
        locationField.classList.remove('hidden');
        if (shipEl.value === 'Diantar Kerumah') {
            deliveryUI.classList.remove('hidden');
            pickupUI.classList.add('hidden');
        } else if (shipEl.value === 'Ambil Ditempat') {
            deliveryUI.classList.add('hidden');
            pickupUI.classList.remove('hidden');
            document.getElementById('location-link').value = "https://maps.app.goo.gl/JExkrRvR5PBah9oaA";
        } else {
            locationField.classList.add('hidden');
            document.getElementById('location-link').value = "";
        }
    } else {
        locationField.classList.add('hidden');
    }
}

function getCurrentLocation() {
    const btn = document.getElementById('get-location-btn');
    const originalText = '<span>📍 Bagikan Lokasi Saya</span>';
    btn.disabled = true;
    btn.innerHTML = '<span>⌛ Mencari Lokasi...</span>';

    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung oleh browser Anda.");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
            document.getElementById('location-link').value = mapsUrl;
            btn.disabled = false;
            btn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-200');
            btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
            btn.innerHTML = '<span>✅ Lokasi Berhasil Dibagikan</span>';
        },
        (error) => {
            let msg = "Gagal mengambil lokasi.";
            if (error.code === 1) msg = "Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda.";
            alert(msg);
            btn.disabled = false;
            btn.innerHTML = originalText;
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
    
    const formattedTotal = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('order-final-total').innerText = formattedTotal;
    
    const stickyTotal = document.getElementById('sticky-order-total');
    if (stickyTotal) {
        stickyTotal.innerText = formattedTotal;
    }
}

function showQRISModal() {
    document.getElementById('qris-modal').classList.remove('hidden');
    document.body.classList.add('modal-active');
}

function closeQRISModal() {
    document.getElementById('qris-modal').classList.add('hidden');
    // Don't remove modal-active if order-modal is still open
    if (document.getElementById('order-modal').classList.contains('hidden')) {
        document.body.classList.remove('modal-active');
    }
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
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
    const isQRIS = pay === 'QRIS';
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    const dateStr = nowWIB.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let itemDetails = "";
    let grandTotal = 0;

    cart.forEach((item, index) => {
        const price = isGajian ? item.hargaGajian : item.harga;
        const subtotal = price * item.qty;
        grandTotal += subtotal;
        itemDetails += `${index + 1}. ${item.nama} (x${item.qty})\n   Harga: Rp ${price.toLocaleString('id-ID')}\n   Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n`;
    });
    
    let locationInfo = "";
    if (locationLink) {
        locationInfo = `*Link Lokasi:* ${locationLink}\n`;
    }

    const message = `*PESANAN BARU - HARAPAN JAYA*
------------------------------------------
*Tanggal Pemesanan:* ${dateStr}
*Atas Nama:* ${name || '-'}
*Metode Bayar:* ${pay}${isQRIS ? ' (Sudah Bayar via QRIS)' : ''}
*Pengiriman:* ${ship}
${locationInfo}
*Daftar Belanja:*
${itemDetails}
------------------------------------------
*TOTAL BAYAR: Rp ${grandTotal.toLocaleString('id-ID')}*

Mohon segera diproses, terima kasih!`;

    const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    
    cart = [];
    saveCart();
    updateCartUI();
    closeOrderModal();
}

// Notification Logic
const firstNames = ["An***", "Bu***", "Ci***", "De***", "Ed***", "Fa***", "Gi***", "Ha***", "Ir***", "Ju***", "Ku***", "Li***", "Mu***", "Nu***", "Ri***", "Sa***", "Ti***", "Wi***", "Yu***"];

function showNotification() {
    if (allProducts.length === 0) return;
    
    const randomName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
    const notifEl = document.getElementById('order-notification');
    const notifText = document.getElementById('notif-text');
    
    if (notifText) {
        notifText.innerHTML = `<strong>${randomName}</strong> Pesan <strong>${randomProduct.nama}</strong>!`;
        
        notifEl.classList.remove('hidden', 'notification-out');
        notifEl.classList.add('notification-in');
        
        setTimeout(() => {
            notifEl.classList.remove('notification-in');
            notifEl.classList.add('notification-out');
            setTimeout(() => {
                notifEl.classList.add('hidden');
            }, 500);
        }, 5000);
    }
}

function startNotificationLoop() {
    setTimeout(() => {
        showNotification();
        setInterval(() => {
            showNotification();
        }, Math.floor(Math.random() * 10000) + 10000);
    }, 3000);
}

fetchProducts();
