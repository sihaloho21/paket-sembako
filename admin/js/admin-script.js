
// Auth Check
if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'login.html';
}
function logout() {
    localStorage.removeItem('admin_logged_in');
    window.location.href = 'login.html';
}

let API_URL = CONFIG.getAdminApiUrl();
const CATEGORIES_SHEET = 'categories';
const PRODUCTS_SHEET = 'Sheet1';
const ORDERS_SHEET = 'orders';
const TUKAR_POIN_SHEET = 'tukar_poin';

let allProducts = [];
let allCategories = [];
let allOrders = [];
let allTukarPoin = [];
let currentOrderFilter = 'semua';

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${sectionId}`).classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        produk: 'Produk',
        kategori: 'Kategori',
        pesanan: 'Pesanan',
        'tukar-poin': 'Tukar Poin',
        'user-points': 'Poin Pengguna',
        pengaturan: 'Pengaturan'
    };
    document.getElementById('section-title').innerText = titles[sectionId];

    if (sectionId === 'kategori') fetchCategories();
    if (sectionId === 'produk') fetchAdminProducts();
    if (sectionId === 'pesanan') fetchOrders();
    if (sectionId === 'tukar-poin') fetchTukarPoin();
    if (sectionId === 'user-points') fetchUserPoints();
    if (sectionId === 'dashboard') updateDashboardStats();
    if (sectionId === 'pengaturan') loadSettings();
}

// ============ DASHBOARD FUNCTIONS ============
async function updateDashboardStats() {
    try {
        const [prodRes, orderRes] = await Promise.all([
            fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`),
            fetch(`${API_URL}?sheet=${ORDERS_SHEET}`)
        ]);
        const prods = await prodRes.json();
        const orders = await orderRes.json();
        
        document.getElementById('stat-total-produk').innerText = prods.length || 0;
        document.getElementById('stat-total-pesanan').innerText = orders.length || 0;
        const lowStock = prods.filter(p => parseInt(p.stok) <= 5).length;
        document.getElementById('stat-stok-menipis').innerText = lowStock;
    } catch (e) { console.error(e); }
}

// ============ ORDER FUNCTIONS ============
async function fetchOrders() {
    const tbody = document.getElementById('order-list-body');
    tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500">Memuat data pesanan...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}?sheet=${ORDERS_SHEET}`);
        allOrders = await response.json();
        if (!Array.isArray(allOrders)) allOrders = [];
        renderOrderTable();
        updateOrderStats();
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-red-500">Gagal memuat data pesanan.</td></tr>';
    }
}

function updateOrderStats() {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status.toLowerCase() === 'menunggu').length;
    const revenue = allOrders.reduce((acc, o) => acc + (parseInt(o.total) || 0), 0);
    const avg = total > 0 ? Math.round(revenue / total) : 0;

    document.getElementById('order-stat-total').innerText = total;
    document.getElementById('order-stat-pending').innerText = pending;
    document.getElementById('order-stat-revenue').innerText = `Rp ${revenue.toLocaleString('id-ID')}`;
    document.getElementById('order-stat-avg').innerText = `Rp ${avg.toLocaleString('id-ID')}`;
    document.getElementById('order-count-display').innerText = `(${total})`;
}

function filterOrders(status) {
    currentOrderFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-green-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-600');
    });
    event.target.classList.add('active', 'bg-green-600', 'text-white');
    event.target.classList.remove('bg-gray-100', 'text-gray-600');
    renderOrderTable();
}

function renderOrderTable() {
    const tbody = document.getElementById('order-list-body');
    const filtered = currentOrderFilter === 'semua' 
        ? allOrders 
        : allOrders.filter(o => o.status.toLowerCase() === currentOrderFilter.toLowerCase());

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500">Tidak ada pesanan.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(o => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-bold text-blue-600 text-xs">${o.id}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${o.pelanggan}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${o.produk}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${o.qty}</td>
            <td class="px-6 py-4 text-sm font-bold text-gray-800">Rp ${parseInt(o.total).toLocaleString('id-ID')}</td>
            <td class="px-6 py-4">
                <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
            </td>
            <td class="px-6 py-4 text-xs text-gray-500">${o.tanggal}</td>
            <td class="px-6 py-4 text-right">
                <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs border rounded-lg p-1 outline-none focus:ring-1 focus:ring-green-500">
                    <option value="">Ubah Status</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Dikirim">Dikirim</option>
                    <option value="Terima">Terima</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.toString().replace(/[^0-9]/g, '');
    if (p.startsWith('62')) p = '0' + p.slice(2);
    else if (p.startsWith('8')) p = '0' + p;
    else if (!p.startsWith('0')) p = '0' + p;
    return p;
}

async function updateOrderStatus(id, newStatus) {
    if (!newStatus) return;
    
    const selectElement = event.target;
    selectElement.disabled = true;

    try {
        const order = allOrders.find(o => o.id === id);
        if (!order) {
            showAdminToast('Pesanan tidak ditemukan!', 'error');
            selectElement.disabled = false;
            return;
        }

        const response = await fetch(`${API_URL}/id/${id}?sheet=${ORDERS_SHEET}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { status: newStatus } })
        });
        const result = await response.json();
        
        if (result.affected > 0 || response.ok) {
            if (newStatus === 'Terima' && order.points_awarded !== 'Ya') {
                if (order.phone && order.poin) {
                    const pointsToAdd = parseFloat(order.poin) || 0;
                    const phone = normalizePhone(order.phone);
                    
                    const userRes = await fetch(`${API_URL}/search?sheet=user_points&phone=${phone}`);
                    const userData = await userRes.json();
                    
                    let pointUpdateSuccess = false;
                    if (Array.isArray(userData) && userData.length > 0) {
                        const currentPoints = parseFloat(userData[0].points) || 0;
                        const updateRes = await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                data: { 
                                    points: currentPoints + pointsToAdd,
                                    last_updated: new Date().toLocaleString('id-ID')
                                } 
                            })
                        });
                        if (updateRes.ok) pointUpdateSuccess = true;
                    } else {
                        const createRes = await fetch(`${API_URL}?sheet=user_points`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                data: { 
                                    phone: phone,
                                    points: pointsToAdd,
                                    last_updated: new Date().toLocaleString('id-ID')
                                } 
                            })
                        });
                        if (createRes.ok) pointUpdateSuccess = true;
                    }

                    if (pointUpdateSuccess) {
                        await fetch(`${API_URL}/id/${id}?sheet=${ORDERS_SHEET}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: { points_awarded: 'Ya' } })
                        });
                        showAdminToast(`Status diperbarui & +${pointsToAdd} poin diberikan ke ${phone}`, 'success');
                    } else {
                        showAdminToast('Status diperbarui, tapi gagal update poin.', 'warning');
                    }
                }
            } else {
                showAdminToast('Status pesanan diperbarui!', 'success');
            }

            const orderIndex = allOrders.findIndex(o => o.id === id);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = newStatus;
                if (newStatus === 'Terima') allOrders[orderIndex].points_awarded = 'Ya';
                renderOrderTable();
                updateOrderStats();
            }
        } else {
            showAdminToast('Gagal memperbarui status di database.', 'error');
        }
    } catch (e) {
        console.error(e);
        showAdminToast('Terjadi kesalahan saat memperbarui status.', 'error');
    } finally {
        selectElement.disabled = false;
    }
}

// ============ CATEGORY FUNCTIONS ============
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`);
        allCategories = await response.json();
        renderCategoryTable();
        updateCategoryDropdown();
    } catch (error) { console.error(error); }
}

function renderCategoryTable() {
    const tbody = document.getElementById('category-list-body');
    if (allCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-10 text-center text-gray-500">Belum ada kategori.</td></tr>';
        return;
    }
    tbody.innerHTML = allCategories.map(c => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 font-bold text-gray-800 text-sm">${c.nama}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${c.deskripsi || '-'}</td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button onclick="openEditCategory('${c.id}', '${c.nama}', '${c.deskripsi}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="handleDeleteCategory('${c.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
    document.getElementById('category-count').innerText = `(${allCategories.length})`;
}

function openEditCategory(id, nama, deskripsi) {
    const newNama = prompt('Nama Kategori:', nama);
    if (newNama === null) return;
    const newDeskripsi = prompt('Deskripsi:', deskripsi);
    if (newDeskripsi === null) return;
    handleEditCategory(id, newNama, newDeskripsi);
}

async function handleEditCategory(id, nama, deskripsi) {
    try {
        const response = await fetch(`${API_URL}/id/${id}?sheet=${CATEGORIES_SHEET}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { nama, deskripsi } })
        });
        const result = await response.json();
        if (result.affected > 0) {
            showAdminToast('Kategori berhasil diperbarui!', 'success');
            fetchCategories();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Gagal memperbarui kategori.', 'error');
    }
}

async function handleDeleteCategory(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
    try {
        const response = await fetch(`${API_URL}/id/${id}?sheet=${CATEGORIES_SHEET}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.deleted > 0) {
            showAdminToast('Kategori berhasil dihapus!', 'success');
            fetchCategories();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Gagal menghapus kategori.', 'error');
    }
}

function updateCategoryDropdown() {
    const select = document.getElementById('form-category');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>' + 
        allCategories.map(c => `<option value="${c.nama}">${c.nama}</option>`).join('');
    select.value = currentVal;
}

// ============ PRODUCT FUNCTIONS ============
async function fetchAdminProducts() {
    const tbody = document.getElementById('admin-product-list');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`);
        allProducts = await response.json();
        renderAdminTable();
        updateDashboardStats();
    } catch (error) { console.error(error); }
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-product-list');
    if (allProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Belum ada produk.</td></tr>';
        return;
    }
    tbody.innerHTML = allProducts.map(p => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${p.gambar ? p.gambar.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-10 h-10 object-cover rounded-lg bg-gray-100">
                    <span class="font-bold text-gray-800 text-sm">${p.nama}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">${p.kategori || '-'}</span>
            </td>
            <td class="px-6 py-4 font-bold text-green-700 text-sm">Rp ${parseInt(p.harga).toLocaleString('id-ID')}</td>
            <td class="px-6 py-4">
                <span class="text-sm ${parseInt(p.stok) <= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}">${p.stok}</span>
            </td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button onclick="openEditModal('${p.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="handleDelete('${p.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function openAddModal() {
    document.getElementById('modal-title').innerText = 'Tambah Produk';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').classList.remove('hidden');
}

function openEditModal(id) {
    const p = allProducts.find(prod => prod.id == id);
    if (!p) return;

    document.getElementById('modal-title').innerText = 'Edit Produk';
    document.getElementById('product-id').value = p.id;
    document.getElementById('form-nama').value = p.nama;
    document.getElementById('form-harga').value = p.harga;
    document.getElementById('form-stok').value = p.stok;
    document.getElementById('form-category').value = p.kategori || '';
    document.getElementById('form-deskripsi').value = p.deskripsi || '';
    
    const images = p.gambar ? p.gambar.split(',') : [];
    document.getElementById('form-gambar-1').value = images[0] || '';
    document.getElementById('form-gambar-2').value = images[1] || '';
    document.getElementById('form-gambar-3').value = images[2] || '';

    document.getElementById('product-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('product-modal').classList.add('hidden'); }

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = 'Menyimpan...';

    const images = [
        document.getElementById('form-gambar-1').value,
        document.getElementById('form-gambar-2').value,
        document.getElementById('form-gambar-3').value
    ].filter(url => url.trim() !== '').join(',');

    const data = {
        nama: document.getElementById('form-nama').value,
        harga: document.getElementById('form-harga').value,
        stok: document.getElementById('form-stok').value,
        kategori: document.getElementById('form-category').value,
        deskripsi: document.getElementById('form-deskripsi').value,
        gambar: images
    };

    try {
        let response;
        if (id) {
            response = await fetch(`${API_URL}/id/${id}?sheet=${PRODUCTS_SHEET}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: data })
            });
        } else {
            const newId = Date.now().toString();
            response = await fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: { ...data, id: newId } })
            });
        }

        const result = await response.json();
        if (result.affected > 0 || result.created > 0) {
            showAdminToast(id ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!', 'success');
            closeModal();
            fetchAdminProducts();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
});

async function handleDelete(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
        const response = await fetch(`${API_URL}/id/${id}?sheet=${PRODUCTS_SHEET}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.deleted > 0) {
            showAdminToast('Produk berhasil dihapus!', 'success');
            fetchAdminProducts();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Gagal menghapus produk.', 'error');
    }
}

document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('form-category-nama').value;
    const deskripsi = document.getElementById('form-category-deskripsi').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Menyimpan...';

    try {
        const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { id: Date.now().toString(), nama, deskripsi } })
        });
        const result = await response.json();
        if (result.created > 0) {
            showAdminToast('Kategori berhasil ditambahkan!', 'success');
            e.target.reset();
            fetchCategories();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// ============ TUKAR POIN FUNCTIONS ============
async function fetchTukarPoin() {
    const tbody = document.getElementById('tukar-poin-list');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?sheet=${TUKAR_POIN_SHEET}`);
        allTukarPoin = await response.json();
        renderTukarPoinTable();
    } catch (error) { console.error(error); }
}

function renderTukarPoinTable() {
    const tbody = document.getElementById('tukar-poin-list');
    if (allTukarPoin.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Belum ada produk tukar poin.</td></tr>';
        return;
    }
    tbody.innerHTML = allTukarPoin.map(p => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${p.gambar || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-cover rounded-lg bg-gray-100">
                    <span class="font-bold text-gray-800 text-sm">${p.nama}</span>
                </div>
            </td>
            <td class="px-6 py-4 font-bold text-amber-600 text-sm">${p.poin} Poin</td>
            <td class="px-6 py-4 text-sm text-gray-600">${p.deskripsi || '-'}</td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
                <button onclick="handleDeleteTukarPoin('${p.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============ USER POINTS FUNCTIONS ============
async function fetchUserPoints() {
    const tbody = document.getElementById('user-points-list');
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?sheet=user_points`);
        const data = await response.json();
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Belum ada data poin pengguna.</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(u => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-bold text-gray-800 text-sm">${u.phone}</td>
                <td class="px-6 py-4 font-bold text-green-600 text-sm">${parseFloat(u.points).toFixed(1)} Poin</td>
                <td class="px-6 py-4 text-xs text-gray-500">${u.last_updated || '-'}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editUserPoints('${u.phone}', ${u.points})" class="text-blue-600 hover:underline text-sm font-bold">Edit Poin</button>
                </td>
            </tr>
        `).join('');
    } catch (error) { console.error(error); }
}

async function editUserPoints(phone, currentPoints) {
    const newPoints = prompt(`Masukkan saldo poin baru untuk ${phone}:`, currentPoints);
    if (newPoints === null || newPoints === "") return;
    
    try {
        const response = await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                data: { 
                    points: parseFloat(newPoints),
                    last_updated: new Date().toLocaleString('id-ID')
                } 
            })
        });
        const result = await response.json();
        if (result.affected > 0) {
            showAdminToast('Saldo poin diperbarui!', 'success');
            fetchUserPoints();
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Gagal memperbarui poin.', 'error');
    }
}

// ============ SETTINGS FUNCTIONS ============
function loadSettings() {
    const config = CONFIG.getAllConfig();
    
    // API Settings
    document.getElementById('settings-main-api').value = config.mainApi;
    document.getElementById('settings-admin-api').value = config.adminApi;
    
    // Gajian Settings
    document.getElementById('gajian-target-day').value = config.gajian.targetDay;
    document.getElementById('gajian-default-markup').value = config.gajian.defaultMarkup * 100;
    
    // Markup Ranges
    renderGajianMarkups(config.gajian.markups);
    
    // Reward Settings
    document.getElementById('reward-point-value').value = config.reward.pointValue;
    document.getElementById('reward-min-point').value = config.reward.minPoint;
    
    // Manual Overrides
    renderRewardOverrides(config.reward.manualOverrides);
}

function renderGajianMarkups(markups) {
    const tbody = document.getElementById('gajian-markups-table');
    tbody.innerHTML = markups.map((m, index) => `
        <tr class="border-b border-gray-50">
            <td class="py-2 px-2">${m.minDays} Hari</td>
            <td class="py-2 px-2 font-bold text-green-600">${(m.rate * 100).toFixed(1)}%</td>
            <td class="py-2 px-2">
                <button onclick="openEditMarkupModal(${index})" class="text-blue-600 hover:underline">Edit</button>
            </td>
        </tr>
    `).join('');
}

function renderRewardOverrides(overrides) {
    const tbody = document.getElementById('reward-overrides-table');
    tbody.innerHTML = Object.entries(overrides).map(([name, points]) => `
        <tr class="border-b border-gray-50">
            <td class="py-2 px-2">${name}</td>
            <td class="py-2 px-2 font-bold text-amber-600">${points} Poin</td>
            <td class="py-2 px-2">
                <button onclick="deleteRewardOverride('${name}')" class="text-red-600 hover:underline">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function saveSettings() {
    const mainApi = document.getElementById('settings-main-api').value;
    const adminApi = document.getElementById('settings-admin-api').value;
    CONFIG.setMainApiUrl(mainApi);
    CONFIG.setAdminApiUrl(adminApi);
    
    const targetDay = parseInt(document.getElementById('gajian-target-day').value);
    const defaultMarkup = parseFloat(document.getElementById('gajian-default-markup').value) / 100;
    
    const currentGajian = CONFIG.getGajianConfig();
    CONFIG.setGajianConfig({
        ...currentGajian,
        targetDay,
        defaultMarkup
    });
    
    const pointValue = parseInt(document.getElementById('reward-point-value').value);
    const minPoint = parseFloat(document.getElementById('reward-min-point').value);
    
    const currentReward = CONFIG.getRewardConfig();
    CONFIG.setRewardConfig({
        ...currentReward,
        pointValue,
        minPoint
    });
    
    showAdminToast('Pengaturan berhasil disimpan!', 'success');
    setTimeout(() => location.reload(), 1000);
}



// ============ MARKUP MODAL FUNCTIONS ============
function openEditMarkupModal(index) {
    const config = CONFIG.getGajianConfig();
    const markup = config.markups[index];
    if (!markup) return;

    document.getElementById('edit-markup-index').value = index;
    document.getElementById('edit-markup-min-days').value = markup.minDays;
    document.getElementById('edit-markup-rate').value = (markup.rate * 100).toFixed(1);
    document.getElementById('edit-markup-modal').classList.remove('hidden');
}

function closeEditMarkupModal() {
    document.getElementById('edit-markup-modal').classList.add('hidden');
}

document.getElementById('edit-markup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-markup-index').value);
    const minDays = parseInt(document.getElementById('edit-markup-min-days').value);
    const rate = parseFloat(document.getElementById('edit-markup-rate').value) / 100;

    const config = CONFIG.getGajianConfig();
    config.markups[index] = { minDays, rate };
    
    // Sort markups by minDays descending to keep logic consistent
    config.markups.sort((a, b) => b.minDays - a.minDays);
    
    CONFIG.setGajianConfig(config);
    renderGajianMarkups(config.markups);
    closeEditMarkupModal();
    showAdminToast('Skema markup diperbarui!', 'success');
});

// ============ REWARD OVERRIDE MODAL FUNCTIONS ============
function openAddOverrideModal() {
    document.getElementById('override-modal-title').innerText = 'Tambah Override Poin';
    document.getElementById('reward-override-form').reset();
    
    const select = document.getElementById('override-product-name');
    select.innerHTML = '<option value="">-- Pilih Produk --</option>' + 
        allProducts.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
    
    document.getElementById('reward-override-modal').classList.remove('hidden');
}

function closeRewardOverrideModal() {
    document.getElementById('reward-override-modal').classList.add('hidden');
}

document.getElementById('reward-override-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const productName = document.getElementById('override-product-name').value;
    const points = parseFloat(document.getElementById('override-point-value').value);

    const config = CONFIG.getRewardConfig();
    config.manualOverrides[productName] = points;
    
    CONFIG.setRewardConfig(config);
    renderRewardOverrides(config.manualOverrides);
    closeRewardOverrideModal();
    showAdminToast('Override poin disimpan!', 'success');
});

function deleteRewardOverride(name) {
    if (!confirm(`Hapus override untuk ${name}?`)) return;
    const config = CONFIG.getRewardConfig();
    delete config.manualOverrides[name];
    CONFIG.setRewardConfig(config);
    renderRewardOverrides(config.manualOverrides);
    showAdminToast('Override poin dihapus!', 'success');
}

// ============ TOAST NOTIFICATION ============
function showAdminToast(message, type = 'info') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.className = 'fixed bottom-8 right-8 z-[100] flex flex-col gap-3';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-amber-500',
        info: 'bg-blue-600'
    };
    
    toast.className = `${bgColors[type] || 'bg-gray-800'} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right min-w-[300px]`;
    
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        <div class="flex-shrink-0">${icons[type] || icons.info}</div>
        <div class="flex-1 font-medium text-sm">${message}</div>
        <button onclick="this.parentElement.remove()" class="flex-shrink-0 hover:bg-white/20 p-1 rounded-lg transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 500);
        }
    }, 4000);
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    showSection('dashboard');
});
