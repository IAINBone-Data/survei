/**
 * CONTROLLER: Menangani logika Bisnis & Database
 */

// --- 1. HANDLE INPUT DATA (doPost) ---
function saveSurveyResponse(jsonData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.RESPONDEN);
    
    if (!sheet) throw new Error("Sheet Database tidak ditemukan!");

    const data = JSON.parse(jsonData);
    const timestamp = new Date();
    const idResponden = generateUUID();

    const newRow = [
      timestamp,
      idResponden,
      data.unit_layanan || "-",
      data.usia || 0,
      data.jenis_kelamin || "-",
      data.pendidikan || "-",
      data.pekerjaan || "-",
      data.jenis_layanan || "-",
      data.u1 || 0, data.u2 || 0, data.u3 || 0,
      data.u4 || 0, data.u5 || 0, data.u6 || 0,
      data.u7 || 0, data.u8 || 0, data.u9 || 0,
      data.saran || "-"
    ];

    sheet.appendRow(newRow);
    return createSuccessResponse({ id: idResponden }, "Data berhasil disimpan");

  } catch (error) {
    Logger.log(error);
    return createErrorResponse("Gagal menyimpan data: " + error.message);
  }
}

// --- 2. HANDLE CONFIG (doGet) ---
function getSurveyConfig() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.CONFIG);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); 

    const config = data.map(row => ({
      kode: row[0],
      pertanyaan: row[1],
      label_skala_1: row[2],
      label_skala_4: row[3]
    }));

    return createSuccessResponse(config, "Konfigurasi dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat config: " + error.message);
  }
}

// --- 3. HANDLE SERVICES (doGet) ---
function getSurveyServices() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.SERVICES);
    
    if(!sheet) return createSuccessResponse({}, "Sheet Services belum dibuat");

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); 

    const servicesMap = {};
    data.forEach(row => {
      const unit = row[0];        
      const layanan = row[1];     

      if (unit && layanan) { 
        if (!servicesMap[unit]) {
          servicesMap[unit] = []; 
        }
        servicesMap[unit].push(layanan);
      }
    });

    return createSuccessResponse(servicesMap, "Layanan dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat services: " + error.message);
  }
}

// --- 4. HANDLE HISTORY (doGet) ---
function getSurveyHistory() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.HISTORY);
    if(!sheet) return createSuccessResponse([], "Belum ada history");

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); 

    const history = data.map(row => ({
      periode: row[0],
      nilai_ikm: row[1],
      mutu: row[2],
      ringkasan: row[3] || "Tidak ada ringkasan tersedia.",
      link_download: row[4] || "#",
      link_preview: row[5] || ""
    }));

    return createSuccessResponse(history, "History dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat history: " + error.message);
  }
}

// --- 5. HANDLE INFO PELAKSANAAN (Horizontal) ---
function getSurveyInfo() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.INFO);
    
    if(!sheet) return createSuccessResponse({}, "Sheet Info belum dibuat");

    const data = sheet.getDataRange().getValues(); // Ambil semua data
    const headers = data[0]; // Baris 1 adalah Header (Kunci)
    const values = data[1];  // Baris 2 adalah Nilai

    const infoData = {};
    
    // Looping dinamis berdasarkan jumlah kolom header
    if (headers && values) {
      headers.forEach((header, index) => {
        // Masukkan ke object: { "Periode": "...", "Status": "..." }
        // Pastikan header tidak kosong
        if (header) {
           infoData[header] = values[index];
        }
      });
    }

    return createSuccessResponse(infoData, "Info dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat info: " + error.message);
  }
}

// --- 6. HANDLE STATISTIK (doGet) ---
function getSurveyStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.REKAP);
    if(!sheet) throw new Error("Sheet Rekap belum disiapkan");

    const stats = {
      total_responden: sheet.getRange("B2").getValue(),
      nilai_ikm: sheet.getRange("B3").getValue(),
      mutu: sheet.getRange("B4").getValue(),
    };
    return createSuccessResponse(stats, "Statistik dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat statistik: " + error.message);
  }
}