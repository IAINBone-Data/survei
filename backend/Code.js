/**
 * API GATEWAY SIM SURVEI
 * ----------------------
 * Ini adalah pintu masuk utama request dari Frontend.
 * Menangani routing berdasarkan parameter 'action'.
 */

function doGet(e) {
  const action = e.parameter.action;

  // --- PUBLIC ACTIONS (Landing Page) ---
  
  if (action === 'getConfig') {
    return getSurveyConfig();
  } 
  else if (action === 'getServices') {
    return getSurveyServices();
  }
  else if (action === 'getStats') {
    return getSurveyStats();
  }
  else if (action === 'getHistory') {
    return getSurveyHistory();
  }
  else if (action === 'getInfo') {
    return getSurveyInfo();
  }
  
  // --- ADMIN ACTIONS (Dashboard & Security) ---
  
  else if (action === 'login') {
    const u = e.parameter.u;
    const p = e.parameter.p;
    return authenticateUser(u, p);
  }
  else if (action === 'getAdminStats') {
    return getAdminStats(e.parameter.token);
  }
  else if (action === 'getAdminData') {
    return getAdminData(e.parameter.token);
  }
  else if (action === 'deleteData') {
    return deleteResponse(e.parameter.token, parseInt(e.parameter.id));
  }
  
  // --- TAMBAHAN MANAJEMEN USER ---
  else if (action === 'getUsers') {
    return getAdminUsers(e.parameter.token);
  }
  else if (action === 'deleteUser') {
    return deleteAdminUser(e.parameter.token, parseInt(e.parameter.id));
  }

  // --- [BARU] SETTINGS POPULASI UNIT ---
  else if (action === 'getSettingsData') {
    return getSettingsData();
  }
  
  // --- DEFAULT ---
  else {
    return createErrorResponse("Action tidak dikenali.");
  }
}

/**
 * Handle POST Request
 */
function doPost(e) {
  // Cek apakah ada konten
  if (!e.postData || !e.postData.contents) {
    // Fallback: Jika dikirim sebagai Form Data biasa (bukan raw JSON body)
    if (e.parameter.action) {
       // Handle Form Data khusus (seperti updatePopulation dari React)
       if (e.parameter.action === 'updatePopulation') {
          return updatePopulation(e.parameter.unit, e.parameter.value);
       }
    }
    return createErrorResponse("Tidak ada data yang dikirim");
  }
  
  const action = e.parameter.action;

  // 1. Update Info Pelaksanaan
  if (action === 'updateInfo') {
    const token = e.parameter.token;
    return updateSurveyInfo(token, e.postData.contents);
  }
  
  // 2. Tambah User Baru
  else if (action === 'addUser') {
    const token = e.parameter.token;
    return addAdminUser(token, e.postData.contents);
  }

  // 3. Ganti Password / Reset Password
  else if (action === 'changePassword') {
    const token = e.parameter.token;
    return changePassword(token, e.postData.contents);
  }

  // 4. [BARU] Update Populasi (Jika dikirim sebagai JSON Body)
  else if (action === 'updatePopulation') {
     // Pastikan data diparsing jika berupa string JSON
     let data;
     try {
       data = JSON.parse(e.postData.contents);
     } catch (err) {
       // Jika gagal parse, asumsikan data sudah dalam format object atau ambil dari parameter
       data = e.parameter;
     }
     
     // Pastikan parameter unit dan value diambil
     const unit = data.unit || e.parameter.unit;
     const value = data.value || e.parameter.value;
     
     return updatePopulation(unit, value);
  }

  // Default: Submit Survei (Public)
  return saveSurveyResponse(e.postData.contents);
}