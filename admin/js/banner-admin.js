/**
 * Banner Admin Management
 * Mengelola banner promosi di admin dashboard
 */

let bannersData = [];
let currentEditingBannerId = null;

/**
 * Load banners from Google Sheets
 */
async function loadBanners() {
    try {
        const apiUrl = CONFIG.getAdminApiUrl();
        const response = await fetch(`${apiUrl}?sheet=Banners`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        bannersData = await response.json();
        
        // Sort by order
        bannersData.sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
        
        renderBannerList();
        updateBannerStats();
        
        console.log(`✅ Loaded ${bannersData.length} banners`);
    } catch (error) {
        console.error('❌ Error loading banners:', error);
        showNotification('Gagal memuat data banner', 'error');
        
        // Show error in table
        document.getElementById('banner-list').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-red-500">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="font-medium">Gagal memuat data banner</p>
                    <p class="text-sm mt-2">${error.message}</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Render banner list in table
 */
function renderBannerList() {
    const tbody = document.getElementById('banner-list');
    
    if (bannersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <p class="font-medium">Belum ada banner</p>
                    <p class="text-sm mt-2">Klik tombol "Tambah Banner" untuk membuat banner pertama</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = bannersData.map(banner => {
        const isActive = banner.active === 'TRUE' || banner.active === true;
        const clicks = parseInt(banner.clicks) || 0;
        
        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4">
                    <img src="${banner.image_url}" alt="${banner.title}" class="w-32 h-20 object-cover rounded-lg shadow-sm">
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${banner.title || 'Untitled'}</div>
                    <div class="text-xs text-gray-500 mt-1 truncate max-w-xs">${banner.redirect_url || '-'}</div>
                </td>
                <td class="px-6 py-4">
                    ${isActive 
                        ? '<span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Aktif</span>'
                        : '<span class="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">Nonaktif</span>'
                    }
                </td>
                <td class="px-6 py-4">
                    <span class="text-gray-700 font-medium">#${banner.order || '-'}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                        <span class="font-bold text-gray-800">${clicks.toLocaleString()}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editBanner('${banner.id}')" class="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="toggleBannerStatus('${banner.id}', ${!isActive})" class="p-2 ${isActive ? 'bg-gray-50 hover:bg-gray-100 text-gray-600' : 'bg-green-50 hover:bg-green-100 text-green-600'} rounded-lg transition" title="${isActive ? 'Nonaktifkan' : 'Aktifkan'}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path></svg>
                        </button>
                        <button onclick="deleteBanner('${banner.id}')" class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" title="Hapus">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update banner statistics
 */
function updateBannerStats() {
    const totalBanners = bannersData.length;
    const activeBanners = bannersData.filter(b => b.active === 'TRUE' || b.active === true).length;
    const totalClicks = bannersData.reduce((sum, b) => sum + (parseInt(b.clicks) || 0), 0);
    const avgCTR = activeBanners > 0 ? (totalClicks / activeBanners).toFixed(1) : 0;
    
    document.getElementById('stat-total-banners').textContent = totalBanners;
    document.getElementById('stat-active-banners').textContent = activeBanners;
    document.getElementById('stat-total-clicks').textContent = totalClicks.toLocaleString();
    document.getElementById('stat-avg-ctr').textContent = `${avgCTR}`;
}

/**
 * Open add banner modal
 */
function openAddBannerModal() {
    currentEditingBannerId = null;
    document.getElementById('banner-modal-title').textContent = 'Tambah Banner Baru';
    document.getElementById('banner-submit-text').textContent = 'Simpan Banner';
    document.getElementById('banner-form').reset();
    document.getElementById('banner-id').value = '';
    document.getElementById('banner-preview-container').classList.add('hidden');
    document.getElementById('banner-modal').classList.remove('hidden');
}

/**
 * Edit banner
 */
function editBanner(bannerId) {
    const banner = bannersData.find(b => b.id == bannerId);
    
    if (!banner) {
        showNotification('Banner tidak ditemukan', 'error');
        return;
    }
    
    currentEditingBannerId = bannerId;
    document.getElementById('banner-modal-title').textContent = 'Edit Banner';
    document.getElementById('banner-submit-text').textContent = 'Update Banner';
    document.getElementById('banner-id').value = bannerId;
    document.getElementById('banner-title').value = banner.title || '';
    document.getElementById('banner-image-url').value = banner.image_url || '';
    document.getElementById('banner-redirect-url').value = banner.redirect_url || '';
    document.getElementById('banner-order').value = banner.order || 1;
    document.getElementById('banner-active').value = banner.active === 'TRUE' || banner.active === true ? 'TRUE' : 'FALSE';
    
    // Show preview
    if (banner.image_url) {
        document.getElementById('banner-preview-img').src = banner.image_url;
        document.getElementById('banner-preview-container').classList.remove('hidden');
    }
    
    document.getElementById('banner-modal').classList.remove('hidden');
}

/**
 * Close banner modal
 */
function closeBannerModal() {
    document.getElementById('banner-modal').classList.add('hidden');
    document.getElementById('banner-form').reset();
    currentEditingBannerId = null;
}

/**
 * Handle banner form submit
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('banner-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBanner();
        });
        
        // Preview image on URL change
        const imageUrlInput = document.getElementById('banner-image-url');
        if (imageUrlInput) {
            imageUrlInput.addEventListener('blur', () => {
                const url = imageUrlInput.value.trim();
                if (url) {
                    document.getElementById('banner-preview-img').src = url;
                    document.getElementById('banner-preview-container').classList.remove('hidden');
                }
            });
        }
    }
});

/**
 * Save banner (add or update)
 */
async function saveBanner() {
    const title = document.getElementById('banner-title').value.trim();
    const imageUrl = document.getElementById('banner-image-url').value.trim();
    const redirectUrl = document.getElementById('banner-redirect-url').value.trim();
    const promoDescription = document.getElementById('banner-promo-description')?.value.trim() || '';
    const promoProducts = document.getElementById('banner-promo-products')?.value.trim() || '';
    const showInPromoPage = document.getElementById('banner-show-promo')?.value || 'FALSE';
    const order = parseInt(document.getElementById('banner-order').value) || 1;
    const active = document.getElementById('banner-active').value;
    
    if (!title || !imageUrl) {
        showNotification('Judul dan URL gambar wajib diisi', 'error');
        return;
    }
    
    const bannerData = {
        title,
        image_url: imageUrl,
        redirect_url: redirectUrl,
        promo_description: promoDescription,
        promo_products: promoProducts,
        show_in_promo_page: showInPromoPage,
        order,
        active,
        clicks: 0
    };
    
    try {
        const apiUrl = CONFIG.getAdminApiUrl();
        
        if (currentEditingBannerId) {
            // Update existing banner
            const response = await fetch(`${apiUrl}/id/${currentEditingBannerId}?sheet=Banners`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bannerData)
            });
            
            if (!response.ok) throw new Error('Failed to update banner');
            
            showNotification('Banner berhasil diupdate', 'success');
        } else {
            // Add new banner
            // Get next ID
            const maxId = bannersData.length > 0 
                ? Math.max(...bannersData.map(b => parseInt(b.id) || 0))
                : 0;
            bannerData.id = maxId + 1;
            
            const response = await fetch(`${apiUrl}?sheet=Banners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [bannerData] })
            });
            
            if (!response.ok) throw new Error('Failed to add banner');
            
            showNotification('Banner berhasil ditambahkan', 'success');
        }
        
        closeBannerModal();
        await loadBanners();
        
        // Refresh banner carousel on main page
        if (window.opener && window.opener.bannerCarousel) {
            window.opener.bannerCarousel.refresh();
        }
    } catch (error) {
        console.error('❌ Error saving banner:', error);
        showNotification('Gagal menyimpan banner: ' + error.message, 'error');
    }
}

/**
 * Toggle banner status (active/inactive)
 */
async function toggleBannerStatus(bannerId, newStatus) {
    try {
        const apiUrl = CONFIG.getAdminApiUrl();
        const response = await fetch(`${apiUrl}/id/${bannerId}?sheet=Banners`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: newStatus ? 'TRUE' : 'FALSE' })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        showNotification(`Banner ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        await loadBanners();
        
        // Refresh banner carousel on main page
        if (window.opener && window.opener.bannerCarousel) {
            window.opener.bannerCarousel.refresh();
        }
    } catch (error) {
        console.error('❌ Error toggling status:', error);
        showNotification('Gagal mengubah status banner', 'error');
    }
}

/**
 * Delete banner (set active to FALSE)
 */
async function deleteBanner(bannerId) {
    const banner = bannersData.find(b => b.id == bannerId);
    
    if (!banner) {
        showNotification('Banner tidak ditemukan', 'error');
        return;
    }
    
    const confirmed = confirm(`Yakin ingin menghapus banner "${banner.title}"?\n\nBanner akan dinonaktifkan dan tidak ditampilkan lagi.`);
    
    if (!confirmed) return;
    
    try {
        const apiUrl = CONFIG.getAdminApiUrl();
        const response = await fetch(`${apiUrl}/id/${bannerId}?sheet=Banners`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: 'FALSE' })
        });
        
        if (!response.ok) throw new Error('Failed to delete banner');
        
        showNotification('Banner berhasil dihapus', 'success');
        await loadBanners();
        
        // Refresh banner carousel on main page
        if (window.opener && window.opener.bannerCarousel) {
            window.opener.bannerCarousel.refresh();
        }
    } catch (error) {
        console.error('❌ Error deleting banner:', error);
        showNotification('Gagal menghapus banner', 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Use existing notification system if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback to alert
    alert(message);
}

// Load banners when banner section is shown
document.addEventListener('DOMContentLoaded', () => {
    // Hook into showSection function
    const originalShowSection = window.showSection;
    
    if (originalShowSection) {
        window.showSection = function(section) {
            originalShowSection(section);
            
            if (section === 'banner') {
                loadBanners();
            }
        };
    }
});
