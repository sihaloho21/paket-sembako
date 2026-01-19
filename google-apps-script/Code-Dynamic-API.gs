/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - PAKET SEMBAKO (DYNAMIC API VERSION)
 * ============================================================================
 * 
 * Version: 2.0
 * Last Updated: 19 Januari 2026
 * 
 * FITUR BARU:
 * - Dynamic API Configuration (bisa ganti API dari admin panel)
 * - Config caching untuk performa
 * - API connection testing
 * - Config history tracking
 * 
 * ============================================================================
 */

// ===== KONFIGURASI GLOBAL =====
const SPREADSHEET_ID = '174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc';
const CACHE_DURATION = 300; // 5 menit dalam detik

// ===== CACHE MANAGEMENT =====
const cache = CacheService.getScriptCache();

/**
 * Fungsi untuk mendapatkan URL API SheetDB yang aktif
 * Membaca dari sheet 'config' dan menyimpan di cache untuk performa
 */
function getActiveApiUrl() {
    // Coba ambil dari cache terlebih dahulu
    const cachedUrl = cache.get('sheetdb_api_url');
    if (cachedUrl) {
        Logger.log('Using cached API URL: ' + cachedUrl);
        return cachedUrl;
    }

    // Jika tidak ada di cache, baca dari sheet
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let configSheet = ss.getSheetByName('config');
        
        // Jika sheet config belum ada, buat dan inisialisasi
        if (!configSheet) {
            configSheet = createConfigSheet(ss);
        }

        const data = configSheet.getDataRange().getValues();
        const headers = data[0];
        const keyCol = headers.indexOf('key');
        const valueCol = headers.indexOf('value');

        // Cari baris dengan key 'sheetdb_api_url'
        for (let i = 1; i < data.length; i++) {
            if (data[i][keyCol] === 'sheetdb_api_url') {
                const apiUrl = data[i][valueCol];
                
                // Simpan ke cache
                cache.put('sheetdb_api_url', apiUrl, CACHE_DURATION);
                
                Logger.log('API URL loaded from config sheet: ' + apiUrl);
                return apiUrl;
            }
        }

        // Jika tidak ditemukan, gunakan default (fallback)
        const defaultUrl = 'https://sheetdb.io/api/v1/tuhdgrr6ngocm';
        Logger.log('No API URL in config, using default: ' + defaultUrl);
        return defaultUrl;

    } catch (error) {
        Logger.log('Error getting API URL: ' + error);
        // Fallback ke URL default jika error
        return 'https://sheetdb.io/api/v1/tuhdgrr6ngocm';
    }
}

/**
 * Fungsi untuk membuat sheet 'config' jika belum ada
 */
function createConfigSheet(spreadsheet) {
    const configSheet = spreadsheet.insertSheet('config');
    
    // Set header
    configSheet.appendRow(['key', 'value', 'description', 'updated_at', 'updated_by']);
    
    // Set default API URL
    configSheet.appendRow([
        'sheetdb_api_url',
        'https://sheetdb.io/api/v1/tuhdgrr6ngocm',
        'API SheetDB Utama',
        new Date(),
        'System'
    ]);
    
    Logger.log('Config sheet created with default values');
    return configSheet;
}

/**
 * Fungsi untuk clear cache (dipanggil saat config diupdate)
 */
function clearApiCache() {
    cache.remove('sheetdb_api_url');
    Logger.log('API URL cache cleared');
}

// ===== ENDPOINT HANDLERS =====

function doGet(e) {
    const action = e.parameter.action;

    try {
        switch (action) {
            case 'read':
                return handleRead(e);
            case 'search':
                return handleSearch(e);
            case 'getConfig':
                return handleGetConfig(e);
            case 'getConfigHistory':
                return handleGetConfigHistory(e);
            default:
                return responseJSON({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        Logger.log('Error in doGet: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

function doPost(e) {
    try {
        const requestData = JSON.parse(e.postData.contents);
        const action = requestData.action;

        switch (action) {
            case 'create':
                return handleCreate(requestData);
            case 'update':
                return handleUpdate(requestData);
            case 'delete':
                return handleDelete(requestData);
            case 'setConfig':
                return handleSetConfig(requestData);
            case 'testApiConnection':
                return handleTestApiConnection(requestData);
            default:
                return responseJSON({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        Logger.log('Error in doPost: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

// ===== CONFIG MANAGEMENT ENDPOINTS =====

/**
 * Endpoint: Get Config
 * Mengambil nilai konfigurasi berdasarkan key
 */
function handleGetConfig(e) {
    const key = e.parameter.key;

    if (!key) {
        return responseJSON({ success: false, message: 'Key parameter required' });
    }

    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const configSheet = ss.getSheetByName('config');

        if (!configSheet) {
            return responseJSON({ success: false, message: 'Config sheet not found' });
        }

        const data = configSheet.getDataRange().getValues();
        const headers = data[0];

        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === key) {
                return responseJSON({
                    success: true,
                    key: data[i][0],
                    value: data[i][1],
                    description: data[i][2],
                    updated_at: data[i][3]
                });
            }
        }

        return responseJSON({ success: false, message: 'Config key not found' });

    } catch (error) {
        Logger.log('Error in handleGetConfig: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Endpoint: Set Config
 * Menyimpan atau mengupdate nilai konfigurasi
 */
function handleSetConfig(data) {
    const { key, value, description } = data;

    if (!key || !value) {
        return responseJSON({ success: false, message: 'Key and value required' });
    }

    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let configSheet = ss.getSheetByName('config');

        // Buat sheet jika belum ada
        if (!configSheet) {
            configSheet = createConfigSheet(ss);
        }

        const dataRange = configSheet.getDataRange();
        const values = dataRange.getValues();
        let rowIndex = -1;

        // Cari apakah key sudah ada
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] === key) {
                rowIndex = i + 1; // +1 karena sheet index dimulai dari 1
                break;
            }
        }

        const timestamp = new Date();

        if (rowIndex > 0) {
            // Update existing row
            configSheet.getRange(rowIndex, 2).setValue(value);
            configSheet.getRange(rowIndex, 3).setValue(description || '');
            configSheet.getRange(rowIndex, 4).setValue(timestamp);
            configSheet.getRange(rowIndex, 5).setValue('Admin');
        } else {
            // Insert new row
            configSheet.appendRow([key, value, description || '', timestamp, 'Admin']);
        }

        // Simpan ke history
        saveConfigHistory(ss, key, value, description);

        // Clear cache agar config baru langsung aktif
        clearApiCache();

        Logger.log(`Config updated: ${key} = ${value}`);

        return responseJSON({
            success: true,
            message: 'Configuration saved successfully',
            timestamp: timestamp
        });

    } catch (error) {
        Logger.log('Error in handleSetConfig: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Endpoint: Get Config History
 * Mengambil riwayat perubahan konfigurasi
 */
function handleGetConfigHistory(e) {
    const limit = parseInt(e.parameter.limit) || 10;

    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        let historySheet = ss.getSheetByName('config_history');

        if (!historySheet) {
            return responseJSON({ success: true, history: [] });
        }

        const data = historySheet.getDataRange().getValues();
        const history = [];

        // Ambil data dari baris terakhir (paling baru)
        const startRow = Math.max(1, data.length - limit);
        for (let i = data.length - 1; i >= startRow; i--) {
            history.push({
                key: data[i][0],
                url: data[i][1],
                description: data[i][2],
                timestamp: data[i][3]
            });
        }

        return responseJSON({ success: true, history: history });

    } catch (error) {
        Logger.log('Error in handleGetConfigHistory: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Endpoint: Test API Connection
 * Menguji koneksi ke API SheetDB
 */
function handleTestApiConnection(data) {
    const testUrl = data.test_url;

    if (!testUrl) {
        return responseJSON({ success: false, message: 'test_url required' });
    }

    try {
        // Test dengan memanggil endpoint products
        const response = UrlFetchApp.fetch(testUrl + '?sheet=products', {
            method: 'get',
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 200) {
            const jsonData = JSON.parse(response.getContentText());
            return responseJSON({
                success: true,
                message: 'Connection successful',
                record_count: Array.isArray(jsonData) ? jsonData.length : 0
            });
        } else {
            return responseJSON({
                success: false,
                message: `Connection failed with status code: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleTestApiConnection: ' + error);
        return responseJSON({
            success: false,
            message: 'Connection failed: ' + error.toString()
        });
    }
}

/**
 * Helper: Simpan riwayat perubahan config
 */
function saveConfigHistory(spreadsheet, key, value, description) {
    let historySheet = spreadsheet.getSheetByName('config_history');

    if (!historySheet) {
        historySheet = spreadsheet.insertSheet('config_history');
        historySheet.appendRow(['key', 'value', 'description', 'timestamp']);
    }

    historySheet.appendRow([key, value, description || '', new Date()]);
}

// ===== DATA OPERATION HANDLERS (MODIFIED TO USE DYNAMIC API) =====

/**
 * Handler: Read
 * Membaca data dari SheetDB menggunakan API URL dinamis
 */
function handleRead(e) {
    const sheet = e.parameter.sheet;

    if (!sheet) {
        return responseJSON({ success: false, message: 'Sheet parameter required' });
    }

    try {
        const apiUrl = getActiveApiUrl();
        const url = `${apiUrl}?sheet=${sheet}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'get',
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 200) {
            const data = JSON.parse(response.getContentText());
            return responseJSON({ success: true, data: data });
        } else {
            Logger.log(`SheetDB API error: ${statusCode}`);
            return responseJSON({
                success: false,
                message: `API error: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleRead: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Handler: Search
 * Mencari data di SheetDB menggunakan API URL dinamis
 */
function handleSearch(e) {
    const sheet = e.parameter.sheet;
    const searchKey = e.parameter.search_key;
    const searchValue = e.parameter.search_value;

    if (!sheet || !searchKey || !searchValue) {
        return responseJSON({ success: false, message: 'Missing required parameters' });
    }

    try {
        const apiUrl = getActiveApiUrl();
        const url = `${apiUrl}/search?sheet=${sheet}&${searchKey}=${encodeURIComponent(searchValue)}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'get',
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 200) {
            const data = JSON.parse(response.getContentText());
            return responseJSON({ success: true, data: data });
        } else {
            return responseJSON({
                success: false,
                message: `API error: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleSearch: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Handler: Create
 * Menambahkan data baru ke SheetDB
 */
function handleCreate(data) {
    const sheet = data.sheet;
    const rowData = data.data;

    if (!sheet || !rowData) {
        return responseJSON({ success: false, message: 'Missing required parameters' });
    }

    try {
        const apiUrl = getActiveApiUrl();
        const url = `${apiUrl}?sheet=${sheet}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({ data: rowData }),
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 201 || statusCode === 200) {
            return responseJSON({ success: true, message: 'Data created successfully' });
        } else {
            return responseJSON({
                success: false,
                message: `API error: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleCreate: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Handler: Update
 * Mengupdate data di SheetDB
 */
function handleUpdate(data) {
    const sheet = data.sheet;
    const searchKey = data.search_key;
    const searchValue = data.search_value;
    const updateData = data.data;

    if (!sheet || !searchKey || !searchValue || !updateData) {
        return responseJSON({ success: false, message: 'Missing required parameters' });
    }

    try {
        const apiUrl = getActiveApiUrl();
        const url = `${apiUrl}/${searchKey}/${encodeURIComponent(searchValue)}?sheet=${sheet}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'patch',
            contentType: 'application/json',
            payload: JSON.stringify({ data: updateData }),
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 200) {
            return responseJSON({ success: true, message: 'Data updated successfully' });
        } else {
            return responseJSON({
                success: false,
                message: `API error: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleUpdate: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

/**
 * Handler: Delete
 * Menghapus data dari SheetDB
 */
function handleDelete(data) {
    const sheet = data.sheet;
    const searchKey = data.search_key;
    const searchValue = data.search_value;

    if (!sheet || !searchKey || !searchValue) {
        return responseJSON({ success: false, message: 'Missing required parameters' });
    }

    try {
        const apiUrl = getActiveApiUrl();
        const url = `${apiUrl}/${searchKey}/${encodeURIComponent(searchValue)}?sheet=${sheet}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'delete',
            muteHttpExceptions: true
        });

        const statusCode = response.getResponseCode();

        if (statusCode === 200) {
            return responseJSON({ success: true, message: 'Data deleted successfully' });
        } else {
            return responseJSON({
                success: false,
                message: `API error: ${statusCode}`
            });
        }

    } catch (error) {
        Logger.log('Error in handleDelete: ' + error);
        return responseJSON({ success: false, message: 'Internal server error' });
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Fungsi untuk mengembalikan response JSON
 */
function responseJSON(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi untuk testing manual (bisa dipanggil dari Script Editor)
 */
function testDynamicApi() {
    const apiUrl = getActiveApiUrl();
    Logger.log('Current API URL: ' + apiUrl);
    
    // Test fetch data
    const response = UrlFetchApp.fetch(apiUrl + '?sheet=products');
    Logger.log('Response: ' + response.getContentText());
}
