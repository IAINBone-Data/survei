const fs = require('fs');
const path = require('path');

// ================================================================
// KONFIGURASI PENTING
// ================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec"; 
// ================================================================

// [FIX] Karena script sekarang ada di dalam 'frontend/scripts/', 
// kita cukup mundur satu langkah (../) untuk sampai ke 'frontend/', 
// lalu masuk ke 'public/data'.
const DATA_DIR = path.join(__dirname, '../public/data');

// Pastikan folder tujuan ada
if (!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fungsi Fetch Data dengan Error Logging
async function fetchData(action, filename) {
    console.log(`⏳ [${action}] Sedang mengambil data...`);
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const text = await response.text();
        
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error(`❌ [${action}] Gagal parsing JSON. Response server:\n${text.substring(0, 200)}...`);
            throw new Error("Response server bukan JSON valid");
        }

        if (json.status === 'success') {
            const filePath = path.join(DATA_DIR, filename);
            fs.writeFileSync(filePath, JSON.stringify(json.data, null, 2));
            console.log(`✅ [${action}] Berhasil disimpan ke ${filename}`);
        } else {
            console.error(`❌ [${action}] Server merespon error: ${json.message}`);
            process.exit(1); 
        }
    } catch (error) {
        console.error(`❌ [${action}] Error Fatal:`, error.message);
        process.exit(1);
    }
}

// Eksekusi Paralel
async function run() {
    console.log(`🚀 Memulai Robot Update Data ke: ${API_URL}`);
    console.log(`📂 Target Folder: ${DATA_DIR}`);

    if (API_URL.includes("GANTI_DENGAN")) {
        console.error("❌ ERROR: URL API belum diganti!");
        process.exit(1);
    }

    await Promise.all([
        fetchData('getConfig', 'config.json'),
        fetchData('getServices', 'services.json'),
        fetchData('getHistory', 'history.json'),
        fetchData('getInfo', 'info.json'),
        // Tambahkan fetchData('getSettingsData', 'settings.json') jika nanti diperlukan
    ]);
    console.log("🎉 Selesai! Semua data berhasil diperbarui.");
}

run();