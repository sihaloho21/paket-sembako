/**
 * Google Apps Script Proxy untuk SheetDB API
 * Paket Sembako - GoSembako
 * 
 * URL SheetDB: https://sheetdb.io/api/v1/tuhdgrr6ngocm
 * Spreadsheet: https://docs.google.com/spreadsheets/d/174qAwA2hddfQOFUFDx7czOtpRlD9WUiiIaf6Yao8WRc/edit
 * 
 * CARA DEPLOY:
 * 1. Buka https://script.google.com/
 * 2. Buat project baru
 * 3. Copy paste kode ini
 * 4. Deploy > New deployment > Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Copy URL Web App yang dihasilkan
 * 8. Paste URL tersebut di config.js (DEFAULTS.MAIN_API dan DEFAULTS.ADMIN_API)
 */

const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/tuhdgrr6ngocm';
const SECRET_KEY = 'PAKET-SEMBAKO-RAHASIA-2026';

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'read';
    const sheet = params.sheet || 'Sheet1';
    
    Logger.log('GET Request - Action: ' + action + ', Sheet: ' + sheet);
    
    if (action === 'read') {
      return handleRead(sheet);
    } else if (action === 'search') {
      return handleSearch(sheet, params);
    }
    
    return createResponse(false, 'Invalid action', null);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const sheetName = payload.sheetName;
    const secretKey = payload.secretKey;
    
    Logger.log('POST Request - Action: ' + action + ', Sheet: ' + sheetName);
    
    // Verify secret key for write operations
    if (secretKey !== SECRET_KEY) {
      return createResponse(false, 'Invalid secret key', null);
    }
    
    if (action === 'create') {
      return handleCreate(sheetName, payload.data);
    } else if (action === 'update') {
      return handleUpdate(sheetName, payload.condition, payload.data);
    } else if (action === 'delete') {
      return handleDelete(sheetName, payload.condition);
    }
    
    return createResponse(false, 'Invalid action', null);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Read data from SheetDB
 */
function handleRead(sheetName) {
  try {
    const url = SHEETDB_API_URL + '?sheet=' + sheetName;
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const data = JSON.parse(response.getContentText());
    
    if (code === 200) {
      return createResponse(true, 'Data retrieved successfully', data);
    } else {
      return createResponse(false, 'Failed to fetch data: ' + code, null);
    }
    
  } catch (error) {
    Logger.log('Error in handleRead: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Search data in SheetDB
 */
function handleSearch(sheetName, params) {
  try {
    // Build search URL
    let url = SHEETDB_API_URL + '/search?sheet=' + sheetName;
    
    // Add search parameters
    for (let key in params) {
      if (key !== 'action' && key !== 'sheet') {
        url += '&' + key + '=' + encodeURIComponent(params[key]);
      }
    }
    
    Logger.log('Search URL: ' + url);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const data = JSON.parse(response.getContentText());
    
    if (code === 200) {
      return createResponse(true, 'Search completed successfully', data);
    } else {
      return createResponse(false, 'Search failed: ' + code, null);
    }
    
  } catch (error) {
    Logger.log('Error in handleSearch: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Create new data in SheetDB
 */
function handleCreate(sheetName, data) {
  try {
    const url = SHEETDB_API_URL + '?sheet=' + sheetName;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ data: data }),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const result = JSON.parse(response.getContentText());
    
    if (code === 201 || code === 200) {
      return createResponse(true, 'Data created successfully', result);
    } else {
      return createResponse(false, 'Failed to create data: ' + code, result);
    }
    
  } catch (error) {
    Logger.log('Error in handleCreate: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Update data in SheetDB
 */
function handleUpdate(sheetName, condition, newData) {
  try {
    // Build URL with condition
    let url = SHEETDB_API_URL;
    
    // SheetDB update format: PUT /id/{value}?sheet=sheetname
    if (condition.id) {
      url += '/id/' + condition.id + '?sheet=' + sheetName;
    } else if (condition.phone) {
      url += '/phone/' + condition.phone + '?sheet=' + sheetName;
    } else {
      // Use first key-value pair as condition
      const key = Object.keys(condition)[0];
      url += '/' + key + '/' + condition[key] + '?sheet=' + sheetName;
    }
    
    Logger.log('Update URL: ' + url);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      payload: JSON.stringify({ data: newData }),
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const result = JSON.parse(response.getContentText());
    
    if (code === 200) {
      return createResponse(true, 'Data updated successfully', result);
    } else {
      return createResponse(false, 'Failed to update data: ' + code, result);
    }
    
  } catch (error) {
    Logger.log('Error in handleUpdate: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Delete data from SheetDB
 */
function handleDelete(sheetName, condition) {
  try {
    // Build URL with condition
    let url = SHEETDB_API_URL;
    
    // SheetDB delete format: DELETE /id/{value}?sheet=sheetname
    if (condition.id) {
      url += '/id/' + condition.id + '?sheet=' + sheetName;
    } else {
      // Use first key-value pair as condition
      const key = Object.keys(condition)[0];
      url += '/' + key + '/' + condition[key] + '?sheet=' + sheetName;
    }
    
    Logger.log('Delete URL: ' + url);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'delete',
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const result = JSON.parse(response.getContentText());
    
    if (code === 200) {
      return createResponse(true, 'Data deleted successfully', result);
    } else {
      return createResponse(false, 'Failed to delete data: ' + code, result);
    }
    
  } catch (error) {
    Logger.log('Error in handleDelete: ' + error.toString());
    return createResponse(false, error.toString(), null);
  }
}

/**
 * Create standardized JSON response
 */
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
