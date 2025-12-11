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
    
    if (headers && values) {
      headers.forEach((header, index) => {
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

// --- 7. HANDLE ADMIN STATISTIK (Secure) ---
function getAdminStats(token) {
  const user = verifyToken(token);
  if (!user) return createErrorResponse("Akses ditolak. Token tidak valid.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetRes = ss.getSheetByName(SHEET_NAME.RESPONDEN);
    const data = sheetRes.getDataRange().getValues();
    const headers = data.shift(); 

    let filteredData = data;
    if (user.role !== 'SuperAdmin' && user.unit_kerja) {
      filteredData = data.filter(row => row[COLUMN_MAP.UNIT_LAYANAN] === user.unit_kerja);
    }

    const totalResponden = filteredData.length;
    
    const trendMap = {};
    filteredData.forEach(row => {
      const date = new Date(row[COLUMN_MAP.TIMESTAMP]);
      const monthKey = Utilities.formatDate(date, "Asia/Jakarta", "MMM yyyy");
      trendMap[monthKey] = (trendMap[monthKey] || 0) + 1;
    });
    const trendData = Object.keys(trendMap).map(key => ({ name: key, jumlah: trendMap[key] }));

    const jobMap = {};
    filteredData.forEach(row => {
      const job = row[COLUMN_MAP.PEKERJAAN] || "Lainnya";
      jobMap[job] = (jobMap[job] || 0) + 1;
    });
    const jobData = Object.keys(jobMap).map(key => ({ name: key, value: jobMap[key] }));

    const sheetRekap = ss.getSheetByName(SHEET_NAME.REKAP);
    const nilaiIKM = sheetRekap.getRange("B3").getValue() || 0;
    const mutu = sheetRekap.getRange("B4").getValue() || "-";

    return createSuccessResponse({
      summary: {
        total: totalResponden,
        ikm: nilaiIKM,
        mutu: mutu,
        laporan: 2 
      },
      charts: {
        trend: trendData,
        demography: jobData
      }
    }, "Statistik dimuat");

  } catch (error) {
    return createErrorResponse("Gagal memuat statistik: " + error.message);
  }
}

// --- 8. GET ADMIN DATA (ROW DATA - UPDATED) ---
function getAdminData(token) {
  const user = verifyToken(token);
  if (!user) return createErrorResponse("Akses ditolak. Token tidak valid.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.RESPONDEN);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); 

    const rows = data.map((row, index) => ({
      rowIndex: index + 2, 
      timestamp: row[0],
      id: row[1],
      unit: row[2],
      usia: row[3],
      jk: row[4],
      pendidikan: row[5],
      pekerjaan: row[6],
      layanan: row[7],
      // TAMBAHAN: Nilai Rinci Per Unsur (Penting untuk Laporan)
      u1: row[8], u2: row[9], u3: row[10], 
      u4: row[11], u5: row[12], u6: row[13],
      u7: row[14], u8: row[15], u9: row[16],
      // ------------------------------------
      nilai_rata: ((row[8]+row[9]+row[10]+row[11]+row[12]+row[13]+row[14]+row[15]+row[16])/9).toFixed(2),
      saran: row[17]
    }));

    let finalData = rows;
    if (user.role !== 'SuperAdmin' && user.unit_kerja) {
      finalData = rows.filter(item => item.unit === user.unit_kerja);
    }

    return createSuccessResponse({
      role: user.role,           
      my_unit: user.unit_kerja,  
      data: finalData
    }, "Data berhasil dimuat");

  } catch (error) {
    return createErrorResponse("Gagal memuat data: " + error.message);
  }
}

// --- 9. DELETE DATA ---
function deleteResponse(token, rowIndex) {
  const user = verifyToken(token);
  if (!user) return createErrorResponse("Akses ditolak.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.RESPONDEN);
    
    if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return createErrorResponse("Baris data tidak valid.");
    }

    sheet.deleteRow(rowIndex);
    return createSuccessResponse(null, "Data berhasil dihapus.");

  } catch (error) {
    return createErrorResponse("Gagal menghapus: " + error.message);
  }
}

// --- 10. UPDATE INFO PELAKSANAAN (BARU) ---
function updateSurveyInfo(token, jsonData) {
  const user = verifyToken(token);
  if (!user) return createErrorResponse("Akses ditolak.");
  if (user.role !== 'SuperAdmin') return createErrorResponse("Akses ditolak. Hanya Super Admin.");

  try {
    const data = JSON.parse(jsonData);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.INFO);
    
    // Asumsi Struktur Sheet Info Horizontal (Baris 1 Header, Baris 2 Value)
    // A2: Periode, B2: Tanggal_Mulai, C2: Tanggal_Selesai, D2: Status
    
    // Pastikan urutan ini sesuai dengan Header di Sheet Anda!
    // Jika header Anda: Periode | Tanggal_Mulai | Tanggal_Selesai | Status
    sheet.getRange("A2").setValue(data.Periode);
    sheet.getRange("B2").setValue(data.Tanggal_Mulai);
    sheet.getRange("C2").setValue(data.Tanggal_Selesai);
    sheet.getRange("D2").setValue(data.Status);

    return createSuccessResponse(null, "Pengaturan berhasil disimpan.");

  } catch (error) {
    return createErrorResponse("Gagal update info: " + error.message);
  }
}

// --- 11. GET USER LIST (MANAJEMEN USER) ---
function getAdminUsers(token) {
  const user = verifyToken(token);
  if (!user) return createErrorResponse("Akses ditolak.");
  if (user.role !== 'SuperAdmin') return createErrorResponse("Hanya SuperAdmin yang bisa melihat daftar user.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.USERS);
    const data = sheet.getDataRange().getValues();
    
    // Skip Header (Baris 1)
    // Struktur: [Username, Hash, Salt, Role, Unit, Token, LastLogin]
    const users = [];
    for (let i = 1; i < data.length; i++) {
      users.push({
        rowIndex: i + 1,
        username: data[i][0],
        role: data[i][3],
        unit: data[i][4],
        last_login: data[i][6]
      });
    }

    return createSuccessResponse(users, "Daftar user dimuat.");
  } catch (error) {
    return createErrorResponse("Gagal memuat users: " + error.message);
  }
}

// --- 12. ADD NEW USER ---
function addAdminUser(token, jsonData) {
  const user = verifyToken(token);
  if (!user || user.role !== 'SuperAdmin') return createErrorResponse("Akses ditolak.");

  try {
    const newData = JSON.parse(jsonData); // {username, password, role, unit}
    
    // Panggil fungsi registrasi dari AuthController.js
    // Pastikan file AuthController.js ada di project GAS Anda
    return registerUser(newData.username, newData.password, newData.role, newData.unit);
    
  } catch (error) {
    return createErrorResponse("Gagal tambah user: " + error.message);
  }
}

// --- 13. DELETE USER ---
function deleteAdminUser(token, targetRowIndex) {
  const user = verifyToken(token);
  if (!user || user.role !== 'SuperAdmin') return createErrorResponse("Akses ditolak.");

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.USERS);
    
    // Validasi sederhana (Jangan hapus baris header atau di luar range)
    if (targetRowIndex < 2 || targetRowIndex > sheet.getLastRow()) {
      return createErrorResponse("Target user tidak valid.");
    }

    // Cek agar tidak menghapus diri sendiri (Opsional tapi disarankan)
    const targetUsername = sheet.getRange(targetRowIndex, 1).getValue();
    if (targetUsername === user.username) {
      return createErrorResponse("Tidak dapat menghapus akun sendiri!");
    }

    sheet.deleteRow(targetRowIndex);
    return createSuccessResponse(null, `User ${targetUsername} dihapus.`);

  } catch (error) {
    return createErrorResponse("Gagal hapus user: " + error.message);
  }
}

// --- 14. GET SETTINGS (POPULASI) ---
function getSettingsData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.SETTINGS || "db_settings");
    
    // Jika sheet belum ada, return kosong agar tidak error
    if (!sheet) return createSuccessResponse({}, "Sheet db_settings belum dibuat");

    const data = sheet.getDataRange().getValues();
    const settings = {};

    // Loop mulai baris ke-2 (index 1) untuk melewati header
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];   // Kolom A: Nama Unit
      const value = data[i][1]; // Kolom B: Jumlah Populasi
      if (key) {
        settings[key] = value;
      }
    }
    return createSuccessResponse(settings, "Settings dimuat");
  } catch (error) {
    return createErrorResponse("Gagal memuat settings: " + error.message);
  }
}

// --- 15. UPDATE SETTINGS (POPULASI) ---
function updatePopulation(unitKey, populationValue) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME.SETTINGS || "db_settings");
    
    // Auto-create sheet jika belum ada (Opsional, untuk keamanan)
    if (!sheet) {
      sheet = ss.insertSheet("db_settings");
      sheet.appendRow(["Key", "Value", "Updated_At"]);
    }

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    // Cari apakah unit sudah ada di sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == unitKey) {
        rowIndex = i + 1; // Konversi ke index baris sheet (1-based)
        break;
      }
    }

    if (rowIndex > -1) {
      // Update jika sudah ada
      sheet.getRange(rowIndex, 2).setValue(populationValue); 
      sheet.getRange(rowIndex, 3).setValue(new Date());      
    } else {
      // Buat baris baru jika belum ada
      sheet.appendRow([unitKey, populationValue, new Date()]);
    }

    return createSuccessResponse({ unit: unitKey, value: populationValue }, "Populasi berhasil diupdate");
  } catch (error) {
    return createErrorResponse("Gagal update populasi: " + error.message);
  }
}
