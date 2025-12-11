// --- KONFIGURASI SIM SURVEI ---

/**
 * ID Spreadsheet Database.
 * Ganti string kosong "" di bawah dengan ID Spreadsheet Anda.
 * ID adalah bagian acak panjang di URL Sheet: /d/123456abcdefg/edit
 */
const SPREADSHEET_ID = "1fgdRDwR6MvIkSaMj-PtWjM0-56MpLDqw2_B-wNifAkg"; 

// Nama-nama Tab/Sheet dalam Spreadsheet
const SHEET_NAME = {
  RESPONDEN: "db_responden", 
  CONFIG: "db_config",       
  REKAP: "db_rekap",         
  HISTORY: "db_history",
  SERVICES: "db_services",
  INFO: "db_info",
  USERS: "db_users",
  SETTINGS: "db_settings" // [BARU] Tambahkan baris ini
};

// Mapping Kolom db_responden
const COLUMN_MAP = {
  TIMESTAMP: 0,
  ID_RESPONDEN: 1,
  UNIT_LAYANAN: 2,
  USIA: 3,
  JENIS_KELAMIN: 4,
  PENDIDIKAN: 5,
  PEKERJAAN: 6,
  JENIS_LAYANAN: 7,
  SARAN: 17
};