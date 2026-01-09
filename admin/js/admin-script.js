    
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
            if (p.startsWith('0')) p = '62' + p.slice(1);
            if (p.startsWith('8')) p = '62' + p;
            return p;
        }

        async function updateOrderStatus(id, newStatus) {
            if (!newStatus) return;
            try {
                // 1. Update order status
                const response = await fetch(`${API_URL}/id/${id}?sheet=${ORDERS_SHEET}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { status: newStatus } })
                });
                const result = await response.json();
                
                if (result.affected > 0) {
                    // 2. If status is 'Terima' or 'Selesai', update user points
                    if (newStatus === 'Terima' || newStatus === 'Selesai') {
                        const order = allOrders.find(o => o.id === id);
                        if (order && order.phone && order.poin) {
                            const pointsToAdd = parseFloat(order.poin) || 0;
                            const phone = normalizePhone(order.phone);
                            
                            // Check if user exists in user_points
                            const userRes = await fetch(`${API_URL}/search?sheet=user_points&phone=${phone}`);
                            const userData = await userRes.json();
                            
                            if (Array.isArray(userData) && userData.length > 0) {
                                // Update existing user
                                const currentPoints = parseFloat(userData[0].points) || 0;
                                await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        data: { 
                                            points: currentPoints + pointsToAdd,
                                            last_updated: new Date().toLocaleString('id-ID')
                                        } 
                                    })
                                });
                            } else {
                                // Create new user entry
                                await fetch(`${API_URL}?sheet=user_points`, {
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
                            }
                        }
                    }
                    
                    alert('Status pesanan diperbarui!');
                    fetchOrders();
                }
            } catch (e) {
                console.error(e);
                alert('Gagal memperbarui status.');
            }
        }

        // ============ USER POINTS FUNCTIONS ============
        async function fetchUserPoints() {
            const tbody = document.getElementById('user-points-list');
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Memuat data poin...</td></tr>';
            
            try {
                const response = await fetch(`${API_URL}?sheet=user_points`);
                let allUserPoints = await response.json();
                if (!Array.isArray(allUserPoints)) allUserPoints = [];
                
                const searchQuery = document.getElementById('user-points-search').value.trim();
                if (searchQuery) {
                    allUserPoints = allUserPoints.filter(up => up.phone.includes(searchQuery));
                }

                if (allUserPoints.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Tidak ada data poin pengguna.</td></tr>';
                    return;
                }

                tbody.innerHTML = allUserPoints.map(up => `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4 text-sm font-medium text-gray-800">${up.phone}</td>
                        <td class="px-6 py-4 text-sm font-bold text-amber-600">${parseFloat(up.points).toFixed(1)} Poin</td>
                        <td class="px-6 py-4 text-xs text-gray-500">${up.last_updated || '-'}</td>
                        <td class="px-6 py-4 text-right">
                            <button onclick="editUserPoints('${up.phone}', ${up.points})" class="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit Poin</button>
                        </td>
                    </tr>
                `).join('');
            } catch (error) {
                console.error('Error:', error);
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-red-500">Gagal memuat data poin. Pastikan sheet "user_points" sudah ada.</td></tr>';
            }
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
                    alert('Saldo poin diperbarui!');
                    fetchUserPoints();
                }
            } catch (e) {
                console.error(e);
                alert('Gagal memperbarui poin.');
            }
        }

        // Add event listener for search input
        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.getElementById('user-points-search');
            if (searchInput) {
                searchInput.addEventListener('input', fetchUserPoints);
            }
        });

        // ============ TUKAR POIN FUNCTIONS ============
        async function fetchTukarPoin() {
            const tbody = document.getElementById('tukar-poin-list');
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Memuat data tukar poin...</td></tr>';
            
            try {
                const response = await fetch(`${API_URL}?sheet=${TUKAR_POIN_SHEET}`);
                allTukarPoin = await response.json();
                if (!Array.isArray(allTukarPoin)) allTukarPoin = [];
                renderTukarPoinTable();
            } catch (error) {
                console.error('Error:', error);
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-red-500">Gagal memuat data tukar poin. Pastikan sheet "tukar_poin" sudah ada.</td></tr>';
            }
        }

        function renderTukarPoinTable() {
            const tbody = document.getElementById('tukar-poin-list');
            if (allTukarPoin.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Belum ada produk tukar poin.</td></tr>';
                return;
            }

            tbody.innerHTML = allTukarPoin.map(tp => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <img src="${tp.gambar}" alt="${tp.judul}" class="w-10 h-10 rounded-lg object-cover bg-gray-100">
                            <span class="font-bold text-gray-800">${tp.judul}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-bold text-amber-600">${tp.poin} Poin</td>
                    <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">${tp.deskripsi || '-'}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick="openEditTukarPoinModal('${tp.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="handleDeleteTukarPoin('${tp.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function openAddTukarPoinModal() {
            document.getElementById('tukar-poin-modal-title').innerText = 'Tambah Produk Tukar Poin';
            document.getElementById('tukar-poin-form').reset();
            document.getElementById('tukar-poin-id').value = '';
            document.getElementById('tukar-poin-modal').classList.remove('hidden');
        }

        function openEditTukarPoinModal(id) {
            const tp = allTukarPoin.find(item => item.id == id);
            if (!tp) return;

            document.getElementById('tukar-poin-modal-title').innerText = 'Edit Produk Tukar Poin';
            document.getElementById('tukar-poin-id').value = tp.id;
            document.getElementById('form-tukar-judul').value = tp.judul;
            document.getElementById('form-tukar-poin').value = tp.poin;
            document.getElementById('form-tukar-gambar').value = tp.gambar;
            document.getElementById('form-tukar-deskripsi').value = tp.deskripsi || '';
            
            document.getElementById('tukar-poin-modal').classList.remove('hidden');
        }

        function closeTukarPoinModal() {
            document.getElementById('tukar-poin-modal').classList.add('hidden');
        }

        async function handleDeleteTukarPoin(id) {
            if (!confirm('Apakah Anda yakin ingin menghapus produk tukar poin ini?')) return;
            
            try {
                const response = await fetch(`${API_URL}/id/${id}?sheet=${TUKAR_POIN_SHEET}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.deleted > 0) {
                    alert('Produk tukar poin berhasil dihapus!');
                    fetchTukarPoin();
                }
            } catch (e) {
                console.error(e);
                alert('Gagal menghapus produk.');
            }
        }

        document.getElementById('tukar-poin-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = document.getElementById('tukar-poin-id').value;
            const data = {
                judul: document.getElementById('form-tukar-judul').value,
                poin: document.getElementById('form-tukar-poin').value,
                gambar: document.getElementById('form-tukar-gambar').value,
                deskripsi: document.getElementById('form-tukar-deskripsi').value
            };

            const btn = document.getElementById('tukar-poin-submit-btn');
            btn.disabled = true;
            btn.innerText = 'Menyimpan...';

            try {
                let response;
                if (id) {
                    // Edit
                    response = await fetch(`${API_URL}/id/${id}?sheet=${TUKAR_POIN_SHEET}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data })
                    });
                } else {
                    // Add
                    data.id = Date.now(); // Simple ID generation
                    response = await fetch(`${API_URL}?sheet=${TUKAR_POIN_SHEET}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: [data] })
                    });
                }

                const result = await response.json();
                if (result.affected > 0 || result.created > 0) {
                    alert(id ? 'Produk diperbarui!' : 'Produk ditambahkan!');
                    closeTukarPoinModal();
                    fetchTukarPoin();
                }
            } catch (e) {
                console.error(e);
                alert('Gagal menyimpan data.');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Simpan';
            }
        });

        // ============ CATEGORY FUNCTIONS ============
        async function fetchCategories() {
            try {
                const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`);
                const data = await response.json();
                allCategories = Array.isArray(data) ? data : [];
                renderCategoryList();
                updateCategoryDropdown();
            } catch (error) { console.error(error); }
        }

        function renderCategoryList() {
            const categoryList = document.getElementById('category-list');
            document.getElementById('category-count').innerText = `(${allCategories.length})`;
            if (allCategories.length === 0) {
                categoryList.innerHTML = '<div class="px-8 py-6 text-center text-gray-500">Belum ada kategori.</div>';
                return;
            }
            categoryList.innerHTML = allCategories.map(cat => `
                <div class="px-8 py-4 hover:bg-gray-50 transition flex items-center justify-between">
                    <div class="flex-1">
                        <h5 class="font-bold text-gray-800">${cat.nama}</h5>
                        <p class="text-sm text-gray-500 mt-1">${cat.deskripsi || '-'}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openEditCategoryModal('${cat.id}', '${cat.nama}', '${cat.deskripsi}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="handleDeleteCategory('${cat.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function openEditCategoryModal(id, nama, deskripsi) {
            const newNama = prompt("Edit Nama Kategori:", nama);
            if (newNama === null) return;
            const newDeskripsi = prompt("Edit Deskripsi Kategori:", deskripsi);
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
                    alert('Kategori berhasil diperbarui!');
                    fetchCategories();
                }
            } catch (error) {
                console.error(error);
                alert('Gagal memperbarui kategori.');
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
                    alert('Kategori berhasil dihapus!');
                    fetchCategories();
                }
            } catch (error) {
                console.error(error);
                alert('Gagal menghapus kategori.');
            }
        }

        function updateCategoryDropdown() {
            const select = document.getElementById('form-category');
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
                    // Update existing
                    response = await fetch(`${API_URL}/id/${id}?sheet=${PRODUCTS_SHEET}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: data })
                    });
                } else {
                    // Create new
                    const newId = Date.now().toString();
                    response = await fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: { ...data, id: newId } })
                    });
                }

                const result = await response.json();
                if (result.affected > 0 || result.created > 0) {
                    alert(id ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
                    closeModal();
                    fetchAdminProducts();
                }
            } catch (error) {
                console.error(error);
                alert('Terjadi kesalahan saat menyimpan data.');
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
                    alert('Produk berhasil dihapus!');
                    fetchAdminProducts();
                }
            } catch (error) {
                console.error(error);
                alert('Gagal menghapus produk.');
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

            const data = {
                nama: nama,
                deskripsi: deskripsi,
            };

            try {
                const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { ...data, id: Date.now().toString() } })
                });

                const result = await response.json();
                if (result.created > 0) {
                    alert('Kategori berhasil ditambahkan!');
                    document.getElementById('category-form').reset();
                    fetchCategories();
                }
            } catch (error) {
                console.error(error);
                alert('Terjadi kesalahan saat menyimpan data.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });

        // Initialize
        showSection('dashboard');
    
        // ============ SETTINGS FUNCTIONS ============
        function loadSettingsUI() {
            // Load current API URLs from localStorage
            const mainApiInput = document.getElementById('settings-main-api');
            const adminApiInput = document.getElementById('settings-admin-api');
            
            if (mainApiInput) {
                mainApiInput.value = CONFIG.getMainApiUrl();
            }
            if (adminApiInput) {
                adminApiInput.value = CONFIG.getAdminApiUrl();
            }
        }

        // ============ GAJIAN CONFIG FUNCTIONS ============
        function loadGajianConfigUI() {
            const config = CONFIG.getGajianConfig();
            const targetDayInput = document.getElementById('gajian-target-day');
            if (targetDayInput) targetDayInput.value = config.targetDay;
            const defaultMarkupInput = document.getElementById('gajian-default-markup');
            if (defaultMarkupInput) defaultMarkupInput.value = Math.round(config.defaultMarkup * 100);
            renderGajianMarkupsTable(config.markups);
        }

        // ============ REWARD CONFIG FUNCTIONS ============
        function loadRewardConfigUI() {
            const config = CONFIG.getRewardConfig();
            const pointValueInput = document.getElementById('reward-point-value');
            if (pointValueInput) pointValueInput.value = config.pointValue;
            const minPointInput = document.getElementById('reward-min-point');
            if (minPointInput) minPointInput.value = config.minPoint;
            renderRewardOverridesTable(config.manualOverrides);
            updateOverrideProductDropdown();
        }

        function renderRewardOverridesTable(overrides) {
            const tbody = document.getElementById('reward-overrides-table');
            if (!tbody) return;
            
            const keys = Object.keys(overrides);
            if (keys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-500 italic">Belum ada override manual.</td></tr>';
                return;
            }

            tbody.innerHTML = keys.map(productName => `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-2 font-medium text-gray-800">${productName}</td>
                    <td class="py-3 px-2 text-amber-600 font-bold">${overrides[productName]} Poin</td>
                    <td class="py-3 px-2">
                        <button type="button" onclick="deleteRewardOverride('${productName}')" class="text-red-600 hover:text-red-800 font-medium text-sm">Hapus</button>
                    </td>
                </tr>
            `).join('');
        }

        function updateOverrideProductDropdown() {
            const select = document.getElementById('override-product-name');
            if (!select) return;
            
            // We need allProducts to be loaded
            if (allProducts.length === 0) {
                // Try fetching if empty
                fetchAdminProducts().then(() => {
                    select.innerHTML = '<option value="">-- Pilih Produk --</option>' + 
                        allProducts.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
                });
            } else {
                select.innerHTML = '<option value="">-- Pilih Produk --</option>' + 
                    allProducts.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
            }
        }

        function openAddOverrideModal() {
            document.getElementById('reward-override-form').reset();
            updateOverrideProductDropdown();
            document.getElementById('reward-override-modal').classList.remove('hidden');
        }

        function closeRewardOverrideModal() {
            document.getElementById('reward-override-modal').classList.add('hidden');
        }

        function deleteRewardOverride(productName) {
            if (confirm(`Hapus override poin untuk "${productName}"?`)) {
                const config = CONFIG.getRewardConfig();
                delete config.manualOverrides[productName];
                CONFIG.setRewardConfig(config);
                renderRewardOverridesTable(config.manualOverrides);
            }
        }
        
        function renderGajianMarkupsTable(markups) {
            const tbody = document.getElementById('gajian-markups-table');
            if (!tbody) return;
            const sorted = [...markups].sort((a, b) => b.minDays - a.minDays);
            tbody.innerHTML = sorted.map((markup, index) => `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-2 font-medium text-gray-800">≥ ${markup.minDays}</td>
                    <td class="py-3 px-2 text-gray-600">${Math.round(markup.rate * 100)}%</td>
                    <td class="py-3 px-2">
                        <button type="button" onclick="openEditMarkupModal(${index})" class="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                    </td>
                </tr>
            `).join('');
        }
        
        function openEditMarkupModal(index) {
            const config = CONFIG.getGajianConfig();
            const markup = config.markups[index];
            document.getElementById('edit-markup-index').value = index;
            document.getElementById('edit-markup-min-days').value = markup.minDays;
            document.getElementById('edit-markup-rate').value = Math.round(markup.rate * 100);
            document.getElementById('edit-markup-modal').classList.remove('hidden');
        }
        
        function closeEditMarkupModal() {
            document.getElementById('edit-markup-modal').classList.add('hidden');
        }

        // Load settings when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadSettingsUI();
            loadGajianConfigUI();
            loadRewardConfigUI();
        });

        const rewardOverrideForm = document.getElementById('reward-override-form');
        if (rewardOverrideForm) {
            rewardOverrideForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const productName = document.getElementById('override-product-name').value;
                const pointValue = parseFloat(document.getElementById('override-point-value').value);
                
                const config = CONFIG.getRewardConfig();
                config.manualOverrides[productName] = pointValue;
                CONFIG.setRewardConfig(config);
                
                renderRewardOverridesTable(config.manualOverrides);
                closeRewardOverrideModal();
                alert('Override poin berhasil disimpan!');
            });
        }

        const editMarkupForm = document.getElementById('edit-markup-form');
        if (editMarkupForm) {
            editMarkupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const index = parseInt(document.getElementById('edit-markup-index').value);
                const minDays = parseInt(document.getElementById('edit-markup-min-days').value);
                const rate = parseInt(document.getElementById('edit-markup-rate').value) / 100;
                const config = CONFIG.getGajianConfig();
                config.markups[index] = { minDays, rate };
                CONFIG.setGajianConfig(config);
                renderGajianMarkupsTable(config.markups);
                closeEditMarkupModal();
                alert('Persentase markup berhasil diperbarui!');
            });
        }

        // Handle settings save
        const settingsSaveBtn = document.querySelector('button:has(svg path[d*="M8 7H5"])');
        if (settingsSaveBtn) {
            settingsSaveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                saveSettings();
            });
        }

        function saveSettings() {
            const mainApiInput = document.getElementById('settings-main-api');
            const adminApiInput = document.getElementById('settings-admin-api');
            const targetDayInput = document.getElementById('gajian-target-day');
            const defaultMarkupInput = document.getElementById('gajian-default-markup');
            
            const mainApiUrl = mainApiInput ? mainApiInput.value : '';
            const adminApiUrl = adminApiInput ? adminApiInput.value : '';
            const targetDay = targetDayInput ? parseInt(targetDayInput.value) : 7;
            const defaultMarkup = defaultMarkupInput ? parseInt(defaultMarkupInput.value) / 100 : 0.25;
            
            const rewardPointValueInput = document.getElementById('reward-point-value');
            const rewardMinPointInput = document.getElementById('reward-min-point');
            const rewardPointValue = rewardPointValueInput ? parseInt(rewardPointValueInput.value) : 10000;
            const rewardMinPoint = rewardMinPointInput ? parseFloat(rewardMinPointInput.value) : 0.1;
            
            let hasError = false;
            let errorMessages = [];

            // Validate URLs
            if (mainApiUrl && !isValidUrl(mainApiUrl)) {
                hasError = true;
                errorMessages.push('URL API Utama tidak valid');
            }
            if (adminApiUrl && !isValidUrl(adminApiUrl)) {
                hasError = true;
                errorMessages.push('URL API Admin tidak valid');
            }
            
            // Validate Gajian config
            if (targetDay < 1 || targetDay > 31) {
                hasError = true;
                errorMessages.push('Tanggal gajian harus antara 1-31');
            }
            if (defaultMarkup < 0 || defaultMarkup > 1) {
                hasError = true;
                errorMessages.push('Markup default harus antara 0-100%');
            }

            if (hasError) {
                alert('Error:\n' + errorMessages.join('\n'));
                return;
            }

            // Save API settings to localStorage
            if (mainApiUrl) CONFIG.setMainApiUrl(mainApiUrl);
            if (adminApiUrl) CONFIG.setAdminApiUrl(adminApiUrl);
            
            // Save Gajian config
            const gajianConfig = CONFIG.getGajianConfig();
            gajianConfig.targetDay = targetDay;
            gajianConfig.defaultMarkup = defaultMarkup;
            CONFIG.setGajianConfig(gajianConfig);

            // Save Reward config
            const rewardConfig = CONFIG.getRewardConfig();
            rewardConfig.pointValue = rewardPointValue;
            rewardConfig.minPoint = rewardMinPoint;
            CONFIG.setRewardConfig(rewardConfig);

            // Update global API_URL variable
            API_URL = CONFIG.getAdminApiUrl();

            alert('✓ Pengaturan berhasil disimpan!\n\nPerubahan akan berlaku pada halaman berikutnya.');
            
            // Optional: Reload data with new API
            setTimeout(() => {
                location.reload();
            }, 1500);
        }

        function isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }

        function resetSettingsToDefault() {
            if (confirm('Apakah Anda yakin ingin mereset semua pengaturan ke nilai default?')) {
                CONFIG.resetToDefault('main');
                CONFIG.resetToDefault('admin');
                alert('✓ Pengaturan telah direset ke default!');
                location.reload();
            }
        }
