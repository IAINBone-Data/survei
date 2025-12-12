// --- KONFIGURASI API ---
// Ganti URL di bawah dengan Web App URL yang Anda dapat dari FASE 3
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec";

/**
 * Mengambil Konfigurasi Pertanyaan
 */
export const fetchConfig = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getConfig`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Gagal load config:", error);
    return { status: "error", message: error.message };
  }
};

/**
 * [BARU] Mengambil Riwayat IKM Terdahulu
 * PENTING: Fungsi ini wajib ada agar Landing Page tidak error/blank
 */
export const fetchHistory = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getHistory`);
    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Gagal load history:", error);
    // Return array kosong agar halaman tetap bisa loading walau data gagal
    return { status: "error", message: error.message, data: [] };
  }
};

/**
 * Mengirim Data Survei
 */
export const submitSurvey = async (formData) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    return { status: "success" };
  } catch (error) {
    console.error("Gagal kirim:", error);
    return { status: "error", message: error.message };
  }
};

