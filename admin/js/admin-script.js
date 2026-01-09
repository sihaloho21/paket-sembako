    
2	        // Auth Check
3	        if (localStorage.getItem('admin_logged_in') !== 'true') {
4	            window.location.href = 'login.html';
5	        }
6	        function logout() {
7	            localStorage.removeItem('admin_logged_in');
8	            window.location.href = 'login.html';
9	        }
10	    
11	    
12	        let API_URL = CONFIG.getAdminApiUrl();
13	        const CATEGORIES_SHEET = 'categories';
14	        const PRODUCTS_SHEET = 'Sheet1';
15	        const ORDERS_SHEET = 'orders';
16	        const TUKAR_POIN_SHEET = 'tukar_poin';
17	        
18	        let allProducts = [];
19	        let allCategories = [];
20	        let allOrders = [];
21	        let allTukarPoin = [];
22	        let currentOrderFilter = 'semua';
23	
24	        function showSection(sectionId) {
25	            document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
26	            document.getElementById(`section-${sectionId}`).classList.remove('hidden');
27	            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
28	            document.getElementById(`nav-${sectionId}`).classList.add('active');
29	            
30	            const titles = {
31	                dashboard: 'Dashboard',
32	                produk: 'Produk',
33	                kategori: 'Kategori',
34	                pesanan: 'Pesanan',
35	                'tukar-poin': 'Tukar Poin',
36	                'user-points': 'Poin Pengguna',
37	                pengaturan: 'Pengaturan'
38	            };
39	            document.getElementById('section-title').innerText = titles[sectionId];
40	
41	            if (sectionId === 'kategori') fetchCategories();
42	            if (sectionId === 'produk') fetchAdminProducts();
43	            if (sectionId === 'pesanan') fetchOrders();
44	            if (sectionId === 'tukar-poin') fetchTukarPoin();
45	            if (sectionId === 'user-points') fetchUserPoints();
46	            if (sectionId === 'dashboard') updateDashboardStats();
47	        }
48	
49	        // ============ DASHBOARD FUNCTIONS ============
50	        async function updateDashboardStats() {
51	            try {
52	                const [prodRes, orderRes] = await Promise.all([
53	                    fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`),
54	                    fetch(`${API_URL}?sheet=${ORDERS_SHEET}`)
55	                ]);
56	                const prods = await prodRes.json();
57	                const orders = await orderRes.json();
58	                
59	                document.getElementById('stat-total-produk').innerText = prods.length || 0;
60	                document.getElementById('stat-total-pesanan').innerText = orders.length || 0;
61	                const lowStock = prods.filter(p => parseInt(p.stok) <= 5).length;
62	                document.getElementById('stat-stok-menipis').innerText = lowStock;
63	            } catch (e) { console.error(e); }
64	        }
65	
66	        // ============ ORDER FUNCTIONS ============
67	        async function fetchOrders() {
68	            const tbody = document.getElementById('order-list-body');
69	            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500">Memuat data pesanan...</td></tr>';
70	            
71	            try {
72	                const response = await fetch(`${API_URL}?sheet=${ORDERS_SHEET}`);
73	                allOrders = await response.json();
74	                if (!Array.isArray(allOrders)) allOrders = [];
75	                renderOrderTable();
76	                updateOrderStats();
77	            } catch (error) {
78	                console.error('Error:', error);
79	                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-red-500">Gagal memuat data pesanan.</td></tr>';
80	            }
81	        }
82	
83	        function updateOrderStats() {
84	            const total = allOrders.length;
85	            const pending = allOrders.filter(o => o.status.toLowerCase() === 'menunggu').length;
86	            const revenue = allOrders.reduce((acc, o) => acc + (parseInt(o.total) || 0), 0);
87	            const avg = total > 0 ? Math.round(revenue / total) : 0;
88	
89	            document.getElementById('order-stat-total').innerText = total;
90	            document.getElementById('order-stat-pending').innerText = pending;
91	            document.getElementById('order-stat-revenue').innerText = `Rp ${revenue.toLocaleString('id-ID')}`;
92	            document.getElementById('order-stat-avg').innerText = `Rp ${avg.toLocaleString('id-ID')}`;
93	            document.getElementById('order-count-display').innerText = `(${total})`;
94	        }
95	
96	        function filterOrders(status) {
97	            currentOrderFilter = status;
98	            document.querySelectorAll('.filter-btn').forEach(btn => {
99	                btn.classList.remove('active', 'bg-green-600', 'text-white');
100	                btn.classList.add('bg-gray-100', 'text-gray-600');
101	            });
102	            event.target.classList.add('active', 'bg-green-600', 'text-white');
103	            event.target.classList.remove('bg-gray-100', 'text-gray-600');
104	            renderOrderTable();
105	        }
106	
107	        function renderOrderTable() {
108	            const tbody = document.getElementById('order-list-body');
109	            const filtered = currentOrderFilter === 'semua' 
110	                ? allOrders 
111	                : allOrders.filter(o => o.status.toLowerCase() === currentOrderFilter.toLowerCase());
112	
113	            if (filtered.length === 0) {
114	                tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500">Tidak ada pesanan.</td></tr>';
115	                return;
116	            }
117	
118	            tbody.innerHTML = filtered.map(o => `
119	                <tr class="hover:bg-gray-50 transition">
120	                    <td class="px-6 py-4 font-bold text-blue-600 text-xs">${o.id}</td>
121	                    <td class="px-6 py-4 text-sm text-gray-800 font-medium">${o.pelanggan}</td>
122	                    <td class="px-6 py-4 text-sm text-gray-600">${o.produk}</td>
123	                    <td class="px-6 py-4 text-sm text-gray-600">${o.qty}</td>
124	                    <td class="px-6 py-4 text-sm font-bold text-gray-800">Rp ${parseInt(o.total).toLocaleString('id-ID')}</td>
125	                    <td class="px-6 py-4">
126	                        <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
127	                    </td>
128	                    <td class="px-6 py-4 text-xs text-gray-500">${o.tanggal}</td>
129	                    <td class="px-6 py-4 text-right">
130	                        <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs border rounded-lg p-1 outline-none focus:ring-1 focus:ring-green-500">
131	                            <option value="">Ubah Status</option>
132	                            <option value="Menunggu">Menunggu</option>
133	                            <option value="Diproses">Diproses</option>
134	                            <option value="Dikirim">Dikirim</option>
135	                            <option value="Terima">Terima</option>
136	                            <option value="Dibatalkan">Dibatalkan</option>
137	                        </select>
138	                    </td>
139	                </tr>
140	            `).join('');
141	        }
142	
143	        function normalizePhone(phone) {
144	            if (!phone) return '';
145	            let p = phone.toString().replace(/[^0-9]/g, '');
146	            if (p.startsWith('62')) p = '0' + p.slice(2);
147	            else if (p.startsWith('8')) p = '0' + p;
148	            else if (!p.startsWith('0')) p = '0' + p;
149	            return p;
150	        }
151	
152	        async function updateOrderStatus(id, newStatus) {
153	            if (!newStatus) return;
154	            
155	            const selectElement = event.target;
156	            selectElement.disabled = true;
157	
158	            try {
159	                const order = allOrders.find(o => o.id === id);
160	                if (!order) {
161	                    showAdminToast('Pesanan tidak ditemukan!', 'error');
162	                    selectElement.disabled = false;
163	                    return;
164	                }
165	
166	                // 1. Update order status
167	                const response = await fetch(`${API_URL}/id/${id}?sheet=${ORDERS_SHEET}`, {
168	                    method: 'PATCH',
169	                    headers: { 'Content-Type': 'application/json' },
170	                    body: JSON.stringify({ data: { status: newStatus } })
171	                });
172	                const result = await response.json();
173	                
174	                // SheetDB returns { "affected": 1 } on success for PATCH
175	                if (result.affected > 0 || response.ok) {
176	                    // 2. If status is 'Terima', update user points
177	                    if (newStatus === 'Terima' && order.points_awarded !== 'Ya') {
178	                        if (order.phone && order.poin) {
179	                            const pointsToAdd = parseFloat(order.poin) || 0;
180	                            const phone = normalizePhone(order.phone);
181	                            
182	                            const userRes = await fetch(`${API_URL}/search?sheet=user_points&phone=${phone}`);
183	                            const userData = await userRes.json();
184	                            
185	                            let pointUpdateSuccess = false;
186	                            if (Array.isArray(userData) && userData.length > 0) {
187	                                const currentPoints = parseFloat(userData[0].points) || 0;
188	                                const updateRes = await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
189	                                    method: 'PATCH',
190	                                    headers: { 'Content-Type': 'application/json' },
191	                                    body: JSON.stringify({ 
192	                                        data: { 
193	                                            points: currentPoints + pointsToAdd,
194	                                            last_updated: new Date().toLocaleString('id-ID')
195	                                        } 
196	                                    })
197	                                });
198	                                if (updateRes.ok) pointUpdateSuccess = true;
199	                            } else {
200	                                const createRes = await fetch(`${API_URL}?sheet=user_points`, {
201	                                    method: 'POST',
202	                                    headers: { 'Content-Type': 'application/json' },
203	                                    body: JSON.stringify({ 
204	                                        data: { 
205	                                            phone: phone,
206	                                            points: pointsToAdd,
207	                                            last_updated: new Date().toLocaleString('id-ID')
208	                                        } 
209	                                    })
210	                                });
211	                                if (createRes.ok) pointUpdateSuccess = true;
212	                            }
213	
214	                            if (pointUpdateSuccess) {
215	                                await fetch(`${API_URL}/id/${id}?sheet=${ORDERS_SHEET}`, {
216	                                    method: 'PATCH',
217	                                    headers: { 'Content-Type': 'application/json' },
218	                                    body: JSON.stringify({ data: { points_awarded: 'Ya' } })
219	                                });
220	                                showAdminToast(`Status diperbarui & +${pointsToAdd} poin diberikan ke ${phone}`, 'success');
221	                            } else {
222	                                showAdminToast('Status diperbarui, tapi gagal update poin.', 'warning');
223	                            }
224	                        } else {
225	                            showAdminToast('Status diperbarui (Poin tidak tersedia/No HP kosong)', 'info');
226	                        }
227	                    } else {
228	                        showAdminToast('Status pesanan diperbarui!', 'success');
229	                    }
230	
231	                    // Update local data and re-render table immediately
232	                    const orderIndex = allOrders.findIndex(o => o.id === id);
233	                    if (orderIndex !== -1) {
234	                        allOrders[orderIndex].status = newStatus;
235	                        if (newStatus === 'Terima') allOrders[orderIndex].points_awarded = 'Ya';
236	                        renderOrderTable();
237	                        updateOrderStats();
238	                    }
239	                } else {
240	                    console.error('Update failed:', result);
241	                    showAdminToast('Gagal memperbarui status di database.', 'error');
242	                }
243	            } catch (e) {
244	                console.error(e);
245	                showAdminToast('Terjadi kesalahan saat memperbarui status.', 'error');
246	            } finally {
247	                selectElement.disabled = false;
248	            }
249	        }
250	
251	        // ============ CATEGORY FUNCTIONS ============
252	        async function fetchCategories() {
253	            try {
254	                const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`);
255	                allCategories = await response.json();
256	                renderCategoryTable();
257	                updateCategoryDropdown();
258	            } catch (error) { console.error(error); }
259	        }
260	
261	        function renderCategoryTable() {
262	            const tbody = document.getElementById('category-list-body');
263	            if (allCategories.length === 0) {
264	                tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-10 text-center text-gray-500">Belum ada kategori.</td></tr>';
265	                return;
266	            }
267	            tbody.innerHTML = allCategories.map(c => `
268	                <tr class="hover:bg-gray-50 transition">
269	                    <td class="px-6 py-4 font-bold text-gray-800 text-sm">${c.nama}</td>
270	                    <td class="px-6 py-4 text-sm text-gray-600">${c.deskripsi || '-'}</td>
271	                    <td class="px-6 py-4 text-right flex justify-end gap-2">
272	                        <button onclick="openEditCategory('${c.id}', '${c.nama}', '${c.deskripsi}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
273	                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
274	                        </button>
275	                        <button onclick="handleDeleteCategory('${c.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
276	                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
277	                        </button>
278	                    </td>
279	                </tr>
280	            `).join('');
281	        }
282	
283	        function openEditCategory(id, nama, deskripsi) {
284	            const newNama = prompt('Nama Kategori:', nama);
285	            if (newNama === null) return;
286	            const newDeskripsi = prompt('Deskripsi:', deskripsi);
287	            if (newDeskripsi === null) return;
288	            
289	            handleEditCategory(id, newNama, newDeskripsi);
290	        }
291	
292	        async function handleEditCategory(id, nama, deskripsi) {
293	            try {
294	                const response = await fetch(`${API_URL}/id/${id}?sheet=${CATEGORIES_SHEET}`, {
295	                    method: 'PATCH',
296	                    headers: { 'Content-Type': 'application/json' },
297	                    body: JSON.stringify({ data: { nama, deskripsi } })
298	                });
299	                const result = await response.json();
300	                if (result.affected > 0) {
301	                    alert('Kategori berhasil diperbarui!');
302	                    fetchCategories();
303	                }
304	            } catch (error) {
305	                console.error(error);
306	                alert('Gagal memperbarui kategori.');
307	            }
308	        }
309	
310	        async function handleDeleteCategory(id) {
311	            if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
312	            try {
313	                const response = await fetch(`${API_URL}/id/${id}?sheet=${CATEGORIES_SHEET}`, {
314	                    method: 'DELETE'
315	                });
316	                const result = await response.json();
317	                if (result.deleted > 0) {
318	                    alert('Kategori berhasil dihapus!');
319	                    fetchCategories();
320	                }
321	            } catch (error) {
322	                console.error(error);
323	                alert('Gagal menghapus kategori.');
324	            }
325	        }
326	
327	        function updateCategoryDropdown() {
328	            const select = document.getElementById('form-category');
329	            const currentVal = select.value;
330	            select.innerHTML = '<option value="">-- Pilih Kategori --</option>' + 
331	                allCategories.map(c => `<option value="${c.nama}">${c.nama}</option>`).join('');
332	            select.value = currentVal;
333	        }
334	
335	        // ============ PRODUCT FUNCTIONS ============
336	        async function fetchAdminProducts() {
337	            const tbody = document.getElementById('admin-product-list');
338	            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
339	            try {
340	                const response = await fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`);
341	                allProducts = await response.json();
342	                renderAdminTable();
343	                updateDashboardStats();
344	            } catch (error) { console.error(error); }
345	        }
346	
347	        function renderAdminTable() {
348	            const tbody = document.getElementById('admin-product-list');
349	            if (allProducts.length === 0) {
350	                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Belum ada produk.</td></tr>';
351	                return;
352	            }
353	            tbody.innerHTML = allProducts.map(p => `
354	                <tr class="hover:bg-gray-50 transition">
355	                    <td class="px-6 py-4">
356	                        <div class="flex items-center gap-3">
357	                            <img src="${p.gambar ? p.gambar.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-10 h-10 object-cover rounded-lg bg-gray-100">
358	                            <span class="font-bold text-gray-800 text-sm">${p.nama}</span>
359	                        </div>
360	                    </td>
361	                    <td class="px-6 py-4">
362	                        <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">${p.kategori || '-'}</span>
363	                    </td>
364	                    <td class="px-6 py-4 font-bold text-green-700 text-sm">Rp ${parseInt(p.harga).toLocaleString('id-ID')}</td>
365	                    <td class="px-6 py-4">
366	                        <span class="text-sm ${parseInt(p.stok) <= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}">${p.stok}</span>
367	                    </td>
368	                    <td class="px-6 py-4 text-right flex justify-end gap-2">
369	                        <button onclick="openEditModal('${p.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
370	                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
371	                        </button>
372	                        <button onclick="handleDelete('${p.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
373	                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
374	                        </button>
375	                    </td>
376	                </tr>
377	            `).join('');
378	        }
379	
380	        function openAddModal() {
381	            document.getElementById('modal-title').innerText = 'Tambah Produk';
382	            document.getElementById('product-id').value = '';
383	            document.getElementById('product-form').reset();
384	            document.getElementById('product-modal').classList.remove('hidden');
385	        }
386	
387	        function openEditModal(id) {
388	            const p = allProducts.find(prod => prod.id == id);
389	            if (!p) return;
390	
391	            document.getElementById('modal-title').innerText = 'Edit Produk';
392	            document.getElementById('product-id').value = p.id;
393	            document.getElementById('form-nama').value = p.nama;
394	            document.getElementById('form-harga').value = p.harga;
395	            document.getElementById('form-stok').value = p.stok;
396	            document.getElementById('form-category').value = p.kategori || '';
397	            document.getElementById('form-deskripsi').value = p.deskripsi || '';
398	            
399	            const images = p.gambar ? p.gambar.split(',') : [];
400	            document.getElementById('form-gambar-1').value = images[0] || '';
401	            document.getElementById('form-gambar-2').value = images[1] || '';
402	            document.getElementById('form-gambar-3').value = images[2] || '';
403	
404	            document.getElementById('product-modal').classList.remove('hidden');
405	        }
406	
407	        function closeModal() { document.getElementById('product-modal').classList.add('hidden'); }
408	
409	        document.getElementById('product-form').addEventListener('submit', async (e) => {
410	            e.preventDefault();
411	            const id = document.getElementById('product-id').value;
412	            const submitBtn = document.getElementById('submit-btn');
413	            const originalText = submitBtn.innerText;
414	            
415	            submitBtn.disabled = true;
416	            submitBtn.innerText = 'Menyimpan...';
417	
418	            const images = [
419	                document.getElementById('form-gambar-1').value,
420	                document.getElementById('form-gambar-2').value,
421	                document.getElementById('form-gambar-3').value
422	            ].filter(url => url.trim() !== '').join(',');
423	
424	            const data = {
425	                nama: document.getElementById('form-nama').value,
426	                harga: document.getElementById('form-harga').value,
427	                stok: document.getElementById('form-stok').value,
428	                kategori: document.getElementById('form-category').value,
429	                deskripsi: document.getElementById('form-deskripsi').value,
430	                gambar: images
431	            };
432	
433	            try {
434	                let response;
435	                if (id) {
436	                    // Update existing
437	                    response = await fetch(`${API_URL}/id/${id}?sheet=${PRODUCTS_SHEET}`, {
438	                        method: 'PATCH',
439	                        headers: { 'Content-Type': 'application/json' },
440	                        body: JSON.stringify({ data: data })
441	                    });
442	                } else {
443	                    // Create new
444	                    const newId = Date.now().toString();
445	                    response = await fetch(`${API_URL}?sheet=${PRODUCTS_SHEET}`, {
446	                        method: 'POST',
447	                        headers: { 'Content-Type': 'application/json' },
448	                        body: JSON.stringify({ data: { ...data, id: newId } })
449	                    });
450	                }
451	
452	                const result = await response.json();
453	                if (result.affected > 0 || result.created > 0) {
454	                    alert(id ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
455	                    closeModal();
456	                    fetchAdminProducts();
457	                }
458	            } catch (error) {
459	                console.error(error);
460	                alert('Terjadi kesalahan saat menyimpan data.');
461	            } finally {
462	                submitBtn.disabled = false;
463	                submitBtn.innerText = originalText;
464	            }
465	        });
466	
467	        async function handleDelete(id) {
468	            if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
469	            try {
470	                const response = await fetch(`${API_URL}/id/${id}?sheet=${PRODUCTS_SHEET}`, {
471	                    method: 'DELETE'
472	                });
473	                const result = await response.json();
474	                if (result.deleted > 0) {
475	                    alert('Produk berhasil dihapus!');
476	                    fetchAdminProducts();
477	                }
478	            } catch (error) {
479	                console.error(error);
480	                alert('Gagal menghapus produk.');
481	            }
482	        }
483	
484	        document.getElementById('category-form').addEventListener('submit', async (e) => {
485	            e.preventDefault();
486	            const nama = document.getElementById('form-category-nama').value;
487	            const deskripsi = document.getElementById('form-category-deskripsi').value;
488	            const submitBtn = e.target.querySelector('button[type="submit"]');
489	            const originalText = submitBtn.innerHTML;
490	
491	            submitBtn.disabled = true;
492	            submitBtn.innerHTML = 'Menyimpan...';
493	
494	            const data = {
495	                nama: nama,
496	                deskripsi: deskripsi,
497	            };
498	
499	            try {
500	                const response = await fetch(`${API_URL}?sheet=${CATEGORIES_SHEET}`, {
501	                    method: 'POST',
502	                    headers: { 'Content-Type': 'application/json' },
503	                    body: JSON.stringify({ data: { ...data, id: Date.now().toString() } })
504	                });
505	                const result = await response.json();
506	                if (result.created > 0) {
507	                    alert('Kategori berhasil ditambahkan!');
508	                    e.target.reset();
509	                    fetchCategories();
510	                }
511	            } catch (error) {
512	                console.error(error);
513	                alert('Terjadi kesalahan saat menyimpan data.');
514	            } finally {
515	                submitBtn.disabled = false;
516	                submitBtn.innerHTML = originalText;
517	            }
518	        });
519	
520	        // ============ TUKAR POIN FUNCTIONS ============
521	        async function fetchTukarPoin() {
522	            const tbody = document.getElementById('tukar-poin-list');
523	            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
524	            try {
525	                const response = await fetch(`${API_URL}?sheet=${TUKAR_POIN_SHEET}`);
526	                allTukarPoin = await response.json();
527	                renderTukarPoinTable();
528	            } catch (error) { console.error(error); }
529	        }
530	
531	        function renderTukarPoinTable() {
532	            const tbody = document.getElementById('tukar-poin-list');
533	            if (allTukarPoin.length === 0) {
534	                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Belum ada produk tukar poin.</td></tr>';
535	                return;
536	            }
537	            tbody.innerHTML = allTukarPoin.map(p => `
538	                <tr class="hover:bg-gray-50 transition">
539	                    <td class="px-6 py-4">
540	                        <div class="flex items-center gap-3">
541	                            <img src="${p.gambar || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-cover rounded-lg bg-gray-100">
542	                            <span class="font-bold text-gray-800 text-sm">${p.nama}</span>
543	                        </div>
544	                    </td>
545	                    <td class="px-6 py-4 font-bold text-amber-600 text-sm">${p.poin} Poin</td>
546	                    <td class="px-6 py-4 text-sm text-gray-600">${p.stok}</td>
547	                    <td class="px-6 py-4 text-right flex justify-end gap-2">
548	                        <button onclick="handleDeleteTukarPoin('${p.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
549	                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
550	                        </button>
551	                    </td>
552	                </tr>
553	            `).join('');
554	        }
555	
556	        document.getElementById('tukar-poin-form').addEventListener('submit', async (e) => {
557	            e.preventDefault();
558	            const submitBtn = e.target.querySelector('button[type="submit"]');
559	            const originalText = submitBtn.innerHTML;
560	            submitBtn.disabled = true;
561	            submitBtn.innerHTML = 'Menyimpan...';
562	
563	            const data = {
564	                id: Date.now().toString(),
565	                nama: document.getElementById('tp-nama').value,
566	                poin: document.getElementById('tp-poin').value,
567	                stok: document.getElementById('tp-stok').value,
568	                gambar: document.getElementById('tp-gambar').value,
569	                deskripsi: document.getElementById('tp-deskripsi').value
570	            };
571	
572	            try {
573	                const response = await fetch(`${API_URL}?sheet=${TUKAR_POIN_SHEET}`, {
574	                    method: 'POST',
575	                    headers: { 'Content-Type': 'application/json' },
576	                    body: JSON.stringify({ data: data })
577	                });
578	                const result = await response.json();
579	                if (result.created > 0) {
580	                    alert('Produk tukar poin berhasil ditambahkan!');
581	                    e.target.reset();
582	                    fetchTukarPoin();
583	                }
584	            } catch (error) { console.error(error); }
585	            finally {
586	                submitBtn.disabled = false;
587	                submitBtn.innerHTML = originalText;
588	            }
589	        });
590	
591	        async function handleDeleteTukarPoin(id) {
592	            if (!confirm('Hapus produk tukar poin ini?')) return;
593	            try {
594	                const response = await fetch(`${API_URL}/id/${id}?sheet=${TUKAR_POIN_SHEET}`, {
595	                    method: 'DELETE'
596	                });
597	                const result = await response.json();
598	                if (result.deleted > 0) {
599	                    alert('Produk tukar poin berhasil dihapus!');
600	                    fetchTukarPoin();
601	                }
602	            } catch (error) { console.error(error); }
603	        }
604	
605	        // ============ USER POINTS FUNCTIONS ============
606	        async function fetchUserPoints() {
607	            const tbody = document.getElementById('user-points-list');
608	            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Memuat data...</td></tr>';
609	            try {
610	                const response = await fetch(`${API_URL}?sheet=user_points`);
611	                const data = await response.json();
612	                if (data.length === 0) {
613	                    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">Belum ada data poin pengguna.</td></tr>';
614	                    return;
615	                }
616	                tbody.innerHTML = data.map(u => `
617	                    <tr class="hover:bg-gray-50 transition">
618	                        <td class="px-6 py-4 font-bold text-gray-800 text-sm">${u.phone}</td>
619	                        <td class="px-6 py-4 font-bold text-green-600 text-sm">${parseFloat(u.points).toFixed(1)} Poin</td>
620	                        <td class="px-6 py-4 text-xs text-gray-500">${u.last_updated || '-'}</td>
621	                        <td class="px-6 py-4 text-right">
622	                            <button onclick="editUserPoints('${u.phone}', ${u.points})" class="text-blue-600 hover:underline text-sm font-bold">Edit Poin</button>
623	                        </td>
624	                    </tr>
625	                `).join('');
626	            } catch (error) { console.error(error); }
627	        }
628	
629	        async function editUserPoints(phone, currentPoints) {
630	            const newPoints = prompt(`Masukkan saldo poin baru untuk ${phone}:`, currentPoints);
631	            if (newPoints === null || newPoints === "") return;
632	            
633	            try {
634	                const response = await fetch(`${API_URL}/phone/${phone}?sheet=user_points`, {
635	                    method: 'PATCH',
636	                    headers: { 'Content-Type': 'application/json' },
637	                    body: JSON.stringify({ 
638	                        data: { 
639	                            points: parseFloat(newPoints),
640	                            last_updated: new Date().toLocaleString('id-ID')
641	                        } 
642	                    })
643	                });
644	                const result = await response.json();
645	                if (result.affected > 0) {
646	                    alert('Saldo poin diperbarui!');
647	                    fetchUserPoints();
648	                }
649	            } catch (error) {
650	                console.error(error);
651	                alert('Gagal memperbarui poin.');
652	            }
653	        }
654	
655	        // ============ SETTINGS FUNCTIONS ============
656	        function loadSettings() {
657	            const config = CONFIG.getAllConfig();
658	            
659	            // API Settings
660	            document.getElementById('setting-main-api').value = config.mainApi;
661	            document.getElementById('setting-admin-api').value = config.adminApi;
662	            
663	            // Gajian Settings
664	            document.getElementById('setting-target-day').value = config.gajian.targetDay;
665	            document.getElementById('setting-default-markup').value = config.gajian.defaultMarkup * 100;
666	            
667	            // Markup Ranges
668	            const rangeContainer = document.getElementById('markup-ranges-container');
669	            rangeContainer.innerHTML = '';
670	            config.gajian.markups.forEach((m, index) => {
671	                addMarkupRangeRow(m.minDays, m.rate * 100);
672	            });
673	            
674	            // Reward Settings
675	            document.getElementById('setting-point-value').value = config.reward.pointValue;
676	            document.getElementById('setting-min-point').value = config.reward.minPoint;
677	            
678	            // Manual Overrides
679	            const overrideContainer = document.getElementById('point-overrides-container');
680	            overrideContainer.innerHTML = '';
681	            Object.entries(config.reward.manualOverrides).forEach(([name, points]) => {
682	                addPointOverrideRow(name, points);
683	            });
684	        }
685	
686	        function addMarkupRangeRow(minDays = '', rate = '') {
687	            const container = document.getElementById('markup-ranges-container');
688	            const div = document.createElement('div');
689	            div.className = 'flex gap-2 items-center markup-range-row';
690	            div.innerHTML = `
691	                <div class="flex-1">
692	                    <input type="number" placeholder="Min Hari" value="${minDays}" class="w-full p-2 border rounded-lg text-sm range-min-days">
693	                </div>
694	                <div class="flex-1">
695	                    <input type="number" step="0.1" placeholder="Markup %" value="${rate}" class="w-full p-2 border rounded-lg text-sm range-rate">
696	                </div>
697	                <button type="button" onclick="this.parentElement.remove()" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
698	                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
699	                </button>
700	            `;
701	            container.appendChild(div);
702	        }
703	
704	        function addPointOverrideRow(productName = '', points = '') {
705	            const container = document.getElementById('point-overrides-container');
706	            const div = document.createElement('div');
707	            div.className = 'flex gap-2 items-center point-override-row';
708	            div.innerHTML = `
709	                <div class="flex-[2]">
710	                    <input type="text" placeholder="Nama Produk" value="${productName}" class="w-full p-2 border rounded-lg text-sm override-name">
711	                </div>
712	                <div class="flex-1">
713	                    <input type="number" step="0.1" placeholder="Poin" value="${points}" class="w-full p-2 border rounded-lg text-sm override-points">
714	                </div>
715	                <button type="button" onclick="this.parentElement.remove()" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
716	                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
717	                </button>
718	            `;
719	            container.appendChild(div);
720	        }
721	
722	        function saveSettings() {
723	            // API Settings
724	            const mainApi = document.getElementById('setting-main-api').value;
725	            const adminApi = document.getElementById('setting-admin-api').value;
726	            CONFIG.setMainApiUrl(mainApi);
727	            CONFIG.setAdminApiUrl(adminApi);
728	            
729	            // Gajian Settings
730	            const targetDay = parseInt(document.getElementById('setting-target-day').value);
731	            const defaultMarkup = parseFloat(document.getElementById('setting-default-markup').value) / 100;
732	            
733	            const markups = [];
734	            document.querySelectorAll('.markup-range-row').forEach(row => {
735	                const minDays = parseInt(row.querySelector('.range-min-days').value);
736	                const rate = parseFloat(row.querySelector('.range-rate').value) / 100;
737	                if (!isNaN(minDays) && !isNaN(rate)) {
738	                    markups.push({ minDays, rate });
739	                }
740	            });
741	            
742	            CONFIG.setGajianConfig({
743	                targetDay,
744	                defaultMarkup,
745	                markups: markups.sort((a, b) => b.minDays - a.minDays)
746	            });
747	            
748	            // Reward Settings
749	            const pointValue = parseInt(document.getElementById('setting-point-value').value);
750	            const minPoint = parseFloat(document.getElementById('setting-min-point').value);
751	            
752	            const manualOverrides = {};
753	            document.querySelectorAll('.point-override-row').forEach(row => {
754	                const name = row.querySelector('.override-name').value;
755	                const points = parseFloat(row.querySelector('.override-points').value);
756	                if (name && !isNaN(points)) {
757	                    manualOverrides[name] = points;
758	                }
759	            });
760	            
761	            CONFIG.setRewardConfig({
762	                pointValue,
763	                minPoint,
764	                manualOverrides
765	            });
766	            
767	            alert('✓ Pengaturan berhasil disimpan!\n\nPerubahan akan berlaku pada halaman berikutnya.');
768	            location.reload();
769	        }
770	
771	        function resetSettings() {
772	            if (confirm('Apakah Anda yakin ingin mereset semua pengaturan ke default?')) {
773	                CONFIG.resetToDefault('main');
774	                CONFIG.resetToDefault('admin');
775	                localStorage.removeItem(CONFIG.STORAGE_KEYS.GAJIAN_CONFIG);
776	                localStorage.removeItem(CONFIG.STORAGE_KEYS.REWARD_CONFIG);
777	                alert('✓ Pengaturan telah direset ke default!');
778	                location.reload();
779	            }
780	        }
781	
782	        // ============ TOAST NOTIFICATION ============
783	        function showAdminToast(message, type = 'info') {
784	            let container = document.getElementById('admin-toast-container');
785	            if (!container) {
786	                container = document.createElement('div');
787	                container.id = 'admin-toast-container';
788	                container.className = 'fixed bottom-8 right-8 z-[100] flex flex-col gap-3';
789	                document.body.appendChild(container);
790	            }
791	
792	            const toast = document.createElement('div');
793	            const bgColors = {
794	                success: 'bg-green-600',
795	                error: 'bg-red-600',
796	                warning: 'bg-amber-500',
797	                info: 'bg-blue-600'
798	            };
799	            
800	            toast.className = `${bgColors[type] || 'bg-gray-800'} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right min-w-[300px]`;
801	            
802	            const icons = {
803	                success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
804	                error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
805	                warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
806	                info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
807	            };
808	
809	            toast.innerHTML = `
810	                <div class="flex-shrink-0">${icons[type] || icons.info}</div>
811	                <div class="flex-1 font-medium text-sm">${message}</div>
812	                <button onclick="this.parentElement.remove()" class="flex-shrink-0 hover:bg-white/20 p-1 rounded-lg transition">
813	                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
814	                </button>
815	            `;
816	
817	            container.appendChild(toast);
818	
819	            setTimeout(() => {
820	                if (toast.parentElement) {
821	                    toast.classList.add('animate-fade-out');
822	                    setTimeout(() => toast.remove(), 500);
823	                }
824	            }, 4000);
825	        }
826	
827	        // ============ INITIALIZATION ============
828	        document.addEventListener('DOMContentLoaded', () => {
829	            showSection('dashboard');
830	            loadSettings();
831	        });
832	    
