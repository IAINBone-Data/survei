const fs = require('fs');
const path = require('path');

// ================================================================
// KONFIGURASI PENTING (WAJIB DIGANTI)
// ================================================================
// Ganti URL di bawah ini dengan URL Web App Google Apps Script Anda yang ASLI
// Contoh: "https://script.google.com/macros/s/AKfycbx.../exec"
const API_URL = "https://script.google.com/macros/s/AKfycbwk31PTpnvLXfSrMMMa9MwT_6E6tq4mk0BdwOuJu3eytnk6JNjN0TKYiI79bpt97KtmHg/exec"; 
// ================================================================

// Lokasi penyimpanan file JSON (di dalam folder public frontend agar bisa diakses web)
// path.join(__dirname, '../frontend/public/data') asumsinya script dijalankan dari folder root/scripts
const DATA_DIR = path.join(__dirname, '../frontend/public/data');

// Pastikan folder tujuan ada
if (!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fungsi Fetch Data dengan Error Logging yang lebih baik
async function fetchData(action, filename) {
    console.log(`⏳ [${action}] Sedang mengambil data...`);
    try {
        // Gunakan fetch native (Node.js 18+)
        const response = await fetch(`${API_URL}?action=${action}`);
        
        // Cek jika response bukan OK (misal 404 atau 500)
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const text = await response.text(); // Ambil teks dulu untuk jaga-jaga jika bukan JSON
        
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error(`❌ [${action}] Gagal parsing JSON. Response server:\n${text.substring(0, 200)}...`);
            throw new Error("Response server bukan JSON valid (Mungkin HTML error page)");
        }

        if (json.status === 'success') {
            const filePath = path.join(DATA_DIR, filename);
            // Simpan JSON ke file dengan indentasi agar rapi
            fs.writeFileSync(filePath, JSON.stringify(json.data, null, 2));
            console.log(`✅ [${action}] Berhasil disimpan ke ${filename}`);
        } else {
            console.error(`❌ [${action}] Server merespon error: ${json.message}`);
            process.exit(1); // Stop jika error agar Action tahu
        }
    } catch (error) {
        console.error(`❌ [${action}] Error Fatal:`, error.message);
        process.exit(1);
    }
}

// Eksekusi Paralel
async function run() {
    console.log(`🚀 Memulai Robot Update Data ke: ${API_URL}`);
    
    if (API_URL.includes("GANTI_DENGAN")) {
        console.error("❌ ERROR: URL API belum diganti!");
        process.exit(1);
    }

    await Promise.all([
        fetchData('getConfig', 'config.json'),
        fetchData('getServices', 'services.json'),
        fetchData('getHistory', 'history.json'),
        fetchData('getInfo', 'info.json'), // [BARU] Tambahkan ini
    ]);
    console.log("🎉 Selesai! Semua data berhasil diperbarui.");
}

run();