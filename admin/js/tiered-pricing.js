/**
 * Tiered Pricing Management for Admin
 */

// Global state
let tieredProducts = [];

/**
 * Initialize tiered pricing page
 */
function initTieredPricing() {
    fetchTieredPricingProducts();
}

/**
 * Fetch products for tiered pricing management
 */
async function fetchTieredPricingProducts() {
    const container = document.getElementById('tiered-pricing-container');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Memuat data produk...</p></div>';

    try {
        const response = await fetch(CONFIG.API_URL);
        const products = await response.json();
        
        // Filter products that have tiered pricing or can have it
        tieredProducts = products;
        
        renderTieredPricingList(products);
    } catch (error) {
        console.error('Error fetching products for tiered pricing:', error);
        container.innerHTML = '<div class="alert alert-danger">Gagal memuat data produk. Silakan coba lagi nanti.</div>';
    }
}

/**
 * Render list of products with tiered pricing controls
 */
function renderTieredPricingList(products) {
    const container = document.getElementById('tiered-pricing-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Tidak ada produk yang ditemukan.</div>';
        return;
    }

    let html = '<div class="row">';
    products.forEach(product => {
        const tiers = parseTiers(product.grosir);
        
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 product-card">
                    <div class="card-body">
                        <h5 class="card-title">${product.nama}</h5>
                        <p class="card-text text-muted small">Harga Normal: ${formatIDR(product.harga)}</p>
                        
                        <div id="tiers-display-${product.id}">
                            ${renderTiersDisplay(tiers)}
                        </div>
                        
                        <div id="tiers-edit-${product.id}" class="d-none mt-3">
                            <h6>Tingkatan Harga Grosir</h6>
                            <div id="tiers-inputs-${product.id}">
                                ${renderTiersInputs(product.id, tiers)}
                            </div>
                            <button class="btn btn-sm btn-outline-primary mt-2 w-100" onclick="addTierInput('${product.id}')">
                                + Tambah Tingkatan
                            </button>
                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-primary btn-sm flex-grow-1" onclick="saveTieredPricing('${product.id}')">Simpan</button>
                                <button class="btn btn-outline-secondary btn-sm flex-grow-1" onclick="cancelTieredPricing('${product.id}')">Batal</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0" id="footer-${product.id}">
                        <button class="btn btn-outline-primary btn-sm w-100" onclick="editTieredPricing('${product.id}')">
                            Kelola Harga Grosir
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Parse tiers from string (e.g., "10:3200,5:3325")
 */
function parseTiers(grosirStr) {
    if (!grosirStr || grosirStr.trim() === '') return [];
    
    try {
        return grosirStr.split(',').map(tier => {
            const [min_qty, price] = tier.split(':');
            return {
                min_qty: parseInt(min_qty),
                price: parseInt(price)
            };
        }).sort((a, b) => b.min_qty - a.min_qty);
    } catch (e) {
        console.error('Error parsing tiers:', e);
        return [];
    }
}

/**
 * Render tiers display HTML
 */
function renderTiersDisplay(tiers) {
    if (tiers.length === 0) {
        return '<p class="text-muted italic small">Belum ada harga grosir</p>';
    }

    let html = '<ul class="list-group list-group-flush small">';
    tiers.forEach(tier => {
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-1 bg-transparent">
                <span>Min. ${tier.min_qty} unit</span>
                <span class="fw-bold text-success">${formatIDR(tier.price)}</span>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

/**
 * Render tiers input fields for editing
 */
function renderTiersInputs(productId, tiers) {
    if (tiers.length === 0) {
        // Add one empty tier by default if none exist
        return renderTierRow(productId, 0, '', '');
    }

    let html = '';
    tiers.forEach((tier, index) => {
        html += renderTierRow(productId, index, tier.min_qty, tier.price);
    });
    return html;
}

/**
 * Render a single tier input row
 */
function renderTierRow(productId, index, minQty, price) {
    return `
        <div class="tier-row mb-2 d-flex gap-2 align-items-end" id="tier-row-${productId}-${index}">
            <div class="flex-grow-1">
                <label class="form-label small mb-1">Min. Qty</label>
                <input type="number" class="form-control form-control-sm" value="${minQty}" 
                    data-product-id="${productId}" data-tier-min-qty placeholder="Contoh: 10">
            </div>
            <div class="flex-grow-1">
                <label class="form-label small mb-1">Harga per Unit (Rp)</label>
                <input type="number" class="form-control form-control-sm" value="${price}" 
                    data-product-id="${productId}" data-tier-price placeholder="Contoh: 3200">
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeTierRow('${productId}', ${index})">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
}

/**
 * Add a new tier input row
 */
function addTierInput(productId) {
    const container = document.getElementById(`tiers-inputs-${productId}`);
    const index = container.querySelectorAll('.tier-row').length;
    const newRow = document.createElement('div');
    newRow.innerHTML = renderTierRow(productId, index, '', '');
    container.appendChild(newRow.firstElementChild);
}

/**
 * Remove a tier input row
 */
function removeTierRow(productId, index) {
    const row = document.getElementById(`tier-row-${productId}-${index}`);
    if (row) row.remove();
}

/**
 * Switch to edit mode
 */
function editTieredPricing(productId) {
    document.getElementById(`tiers-display-${productId}`).classList.add('d-none');
    document.getElementById(`tiers-edit-${productId}`).classList.remove('d-none');
    document.getElementById(`footer-${productId}`).classList.add('d-none');
}

/**
 * Save tiered pricing data
 */
async function saveTieredPricing(productId) {
    // Collect tier data from inputs
    const minQtyInputs = document.querySelectorAll(`[data-product-id="${productId}"][data-tier-min-qty]`);
    const priceInputs = document.querySelectorAll(`[data-product-id="${productId}"][data-tier-price]`);
    
    if (minQtyInputs.length === 0) {
        showAdminToast('Tidak ada tingkatan harga untuk disimpan', 'warning');
        return;
    }
    
    const tiers = [];
    minQtyInputs.forEach((input, index) => {
        const minQty = parseInt(input.value);
        const price = parseInt(priceInputs[index].value);
        
        if (isNaN(minQty) || isNaN(price) || minQty < 1 || price < 0) {
            // Skip empty rows if any
            return;
        }
        
        tiers.push({ min_qty: minQty, price });
    });
    
    if (tiers.length === 0) {
        showAdminToast('Mohon isi data tingkatan harga dengan benar', 'warning');
        return;
    }
    
    // Validate tiers
    if (!validateTiers(tiers)) {
        showAdminToast('Tingkatan harga tidak valid. Pastikan min_qty naik dan harga turun', 'error');
        return;
    }
    
    try {
        // Sort tiers by min_qty descending for consistent storage format
        tiers.sort((a, b) => b.min_qty - a.min_qty);
        
        await updateProductGrosir(productId, tiers);
        showAdminToast('Harga grosir berhasil disimpan!', 'success');
        fetchTieredPricingProducts();
    } catch (error) {
        console.error('Error saving tiered pricing:', error);
        showAdminToast('Gagal menyimpan harga grosir', 'error');
    }
}

/**
 * Validate tier structure
 */
function validateTiers(tiers) {
    if (tiers.length <= 1) return true;
    
    // Sort by min_qty ascending for validation
    const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
    
    for (let i = 0; i < sorted.length - 1; i++) {
        // As min_qty increases, price must decrease
        if (sorted[i].min_qty >= sorted[i + 1].min_qty) {
            return false; // min_qty must be strictly increasing
        }
        if (sorted[i].price <= sorted[i + 1].price) {
            return false; // price must be strictly decreasing
        }
    }
    
    return true;
}

/**
 * Cancel tiered pricing edit
 */
function cancelTieredPricing(productId) {
    fetchTieredPricingProducts();
}

/**
 * Update product grosir data via SheetDB API
 */
async function updateProductGrosir(productId, tiers) {
    // Convert tiers to string format "10:3200,5:3325"
    const grosirStr = tiers.map(t => `${t.min_qty}:${t.price}`).join(',');
    
    // In a real implementation, this would call the SheetDB API
    // For this simulation, we'll just log it and update the local state
    console.log(`Updating product ${productId} with grosir: ${grosirStr}`);
    
    const response = await fetch(`${CONFIG.API_URL}/id/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            grosir: grosirStr
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update product');
    }
    
    return await response.json();
}

/**
 * Format number to IDR currency
 */
function formatIDR(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

/**
 * Show toast notification (simplified)
 */
function showAdminToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'error' ? 'bg-danger' : (type === 'success' ? 'bg-success' : 'bg-primary');
    
    const toastHtml = `
        <div id="${toastId}" class="toast show align-items-center text-white ${bgColor} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        const toast = document.getElementById(toastId);
        if (toast) toast.remove();
    }, 3000);
}
