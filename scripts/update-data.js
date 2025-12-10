const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
// GANTI DENGAN URL WEB APP GOOGLE SCRIPT ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbwk31PTpnvLXfSrMMMa9MwT_6E6tq4mk0BdwOuJu3eytnk6JNjN0TKYiI79bpt97KtmHg/exec"; 

// Lokasi penyimpanan file JSON (di dalam folder public frontend agar bisa diakses web)
const DATA_DIR = path.join(__dirname, '../frontend/public/data');

// Pastikan folder tujuan ada
if (!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fungsi Fetch Data
async function fetchData(action, filename) {
    console.log(`⏳ Mengambil data: ${action}...`);
    try {
        // Gunakan fetch native (Node.js 18+)
        const response = await fetch(`${API_URL}?action=${action}`);
        const json = await response.json();

        if (json.status === 'success') {
            const filePath = path.join(DATA_DIR, filename);
            // Simpan JSON ke file dengan indentasi agar rapi
            fs.writeFileSync(filePath, JSON.stringify(json.data, null, 2));
            console.log(`✅ Berhasil disimpan: ${filename}`);
        } else {
            console.error(`❌ Gagal mengambil ${action}: ${json.message}`);
            process.exit(1); // Stop jika error agar Action tahu
        }
    } catch (error) {
        console.error(`❌ Error Fetch ${action}:`, error);
        process.exit(1);
    }
}

// Eksekusi Paralel
async function run() {
    await Promise.all([
        fetchData('getConfig', 'config.json'),
        fetchData('getServices', 'services.json'),
        fetchData('getHistory', 'history.json'),
        // Statistik tidak perlu di-cache static karena butuh realtime, 
        // tapi kalau mau cepat bisa juga:
        // fetchData('getStats', 'stats.json') 
    ]);
    console.log("🎉 Semua data berhasil diperbarui!");
}

run();