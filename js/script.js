const API_URL = 'https://sheetdb.io/api/v1/637uvuabexalz';
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
            let category = p.kategori || 'Bahan Pokok';
            if (!p.kategori) {
                if (cashPrice >= 150000) category = 'Paket Lengkap';
                else if (cashPrice >= 50000) category = 'Paket Hemat';
            }
            
            // Default description if empty
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
        const images = p.gambar ? p.gambar.split(',') : [];
        const mainImage = images[0] || 'https://via.placeholder.com/300x200?text=Produk';

        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 relative">
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
                    <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600">
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
    if (cart[index].qty < 1) cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

function removeFromCart(index) {
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

let currentSlide = 0;
let sliderInterval;

function showDetail(p) {
    const itemsList = document.getElementById('modal-items-list');
    const badges = document.getElementById('modal-badges');
    itemsList.innerHTML = '';
    badges.innerHTML = '';

    // Set Basic Info
    document.getElementById('modal-product-name').innerText = p.nama;
    document.getElementById('modal-cash-price').innerText = `Rp ${p.harga.toLocaleString('id-ID')}`;
    document.getElementById('modal-gajian-price').innerText = `Rp ${p.hargaGajian.toLocaleString('id-ID')}`;

    // Badges
    const badgeClass = "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider";
    badges.innerHTML = `
        <span class="bg-green-100 text-green-700 ${badgeClass}">${p.category}</span>
        ${p.stok <= 5 ? `<span class="bg-orange-100 text-orange-700 ${badgeClass}">Stok Terbatas</span>` : ''}
    `;

    // Savings Highlight
    const savings = Math.round(p.harga * 0.15); // Dummy savings logic
    document.getElementById('savings-amount').innerText = `Rp ${savings.toLocaleString('id-ID')}`;
    document.getElementById('savings-highlight').classList.remove('hidden');

    // Update Label to "Deskripsi / Isi Paket"
    const detailTitle = document.querySelector('#detail-modal h4');
    if (detailTitle) {
        detailTitle.innerHTML = `
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            Deskripsi / Isi Paket:
        `;
    }

    // Items List (Split by comma or newline)
    const items = p.deskripsi.split(/[,\n]/);
    const getIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('beras')) return '🌾';
        if (n.includes('minyak')) return '🧪';
        if (n.includes('gula')) return '🍬';
        if (n.includes('mie')) return '🍜';
        if (n.includes('teh')) return '☕';
        if (n.includes('kopi')) return '☕';
        if (n.includes('susu')) return '🥛';
        if (n.includes('telur')) return '🥚';
        return '📦';
    };

    items.forEach(item => {
        if (item.trim() === "") return;
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
    const images = p.gambar ? p.gambar.split(',') : ['https://via.placeholder.com/400x300?text=Produk']; 
    
    slider.innerHTML = images.map(img => `
        <img src="${img.trim()}" class="w-full h-full object-cover flex-shrink-0" onerror="this.src='https://via.placeholder.com/400x300?text=Produk'">
    `).join('');
    
    dotsContainer.innerHTML = images.map((_, i) => `
        <div class="slider-dot w-2 h-2 rounded-full bg-white/50 transition-all duration-300 ${i === 0 ? 'bg-white w-4' : ''}" onclick="goToSlide(${i})" data-index="${i}"></div>
    `).join('');

    // Slider Logic
    currentSlide = 0;
    window.goToSlide = (index) => {
        currentSlide = index;
        updateSlider();
        startSlider(); // Reset interval
    };

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
    
    // Manual Swipe Support (Simple)
    let touchStartX = 0;
    sliderContainer.ontouchstart = (e) => {
        clearInterval(sliderInterval);
        touchStartX = e.touches[0].clientX;
    };
    sliderContainer.ontouchend = (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) {
            // Swipe Left
            currentSlide = (currentSlide + 1) % images.length;
        } else if (touchEndX - touchStartX > 50) {
            // Swipe Right
            currentSlide = (currentSlide - 1 + images.length) % images.length;
        }
        updateSlider();
        startSlider();
    };

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
        if (shipEl.value === 'Antar Nikomas' || shipEl.value === 'Antar Kerumah') {
            deliveryUI.classList.remove('hidden');
            pickupUI.classList.add('hidden');
        } else {
            deliveryUI.classList.add('hidden');
            pickupUI.classList.remove('hidden');
        }
    }
}

function updateOrderTotal() {
    const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
    document.getElementById('order-total').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
    document.body.classList.remove('modal-active');
}

async function submitOrder() {
    const name = document.getElementById('customer-name').value;
    const shipMethod = document.querySelector('input[name="ship-method"]:checked')?.value;
    const payMethod = document.querySelector('input[name="pay-method"]:checked')?.value;
    const location = document.getElementById('location-link').value;

    if (!name || !shipMethod || !payMethod) {
        alert('Mohon lengkapi data pemesanan.');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
    const itemsText = cart.map(item => `- ${item.nama} (x${item.qty})`).join('\n');
    
    const message = `*PESANAN BARU - HARAPAN JAYA*\n\n` +
                    `*Nama:* ${name}\n` +
                    `*Metode:* ${shipMethod}\n` +
                    `*Pembayaran:* ${payMethod}\n` +
                    `*Lokasi:* ${location || '-'}\n\n` +
                    `*Item:*\n${itemsText}\n\n` +
                    `*Total Estimasi:* Rp ${total.toLocaleString('id-ID')}\n\n` +
                    `Mohon segera diproses. Terima kasih!`;

    const waUrl = `https://wa.me/628993370200?text=${encodeURIComponent(message)}`;
    
    // Log to SheetDB (Optional but good for tracking)
    try {
        await fetch('https://sheetdb.io/api/v1/637uvuabexalz?sheet=logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [{
                    timestamp: new Date().toLocaleString(),
                    nama: name,
                    pesanan: itemsText,
                    total: total,
                    metode: shipMethod,
                    pembayaran: payMethod
                }]
            })
        });
    } catch (e) { console.error(e); }

    window.open(waUrl, '_blank');
    cart = [];
    saveCart();
    updateCartUI();
    closeOrderModal();
    alert('Pesanan Anda telah diteruskan ke WhatsApp!');
}

function shareProduct(name) {
    const text = `Cek paket sembako murah "${name}" di Harapan Jaya! Kualitas terjamin, harga bersahabat.`;
    const url = window.location.href;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(waUrl, '_blank');
}

function startNotificationLoop() {
    const names = ['Siti', 'Budi', 'Ani', 'Joko', 'Rina', 'Agus', 'Dewi', 'Eko'];
    const products = ['Paket Sembako 1', 'Paket Sembako 2', 'Beras Premium', 'Minyak Goreng'];
    
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
fetchProducts();
