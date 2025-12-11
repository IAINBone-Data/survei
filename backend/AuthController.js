/**
 * AUTH CONTROLLER
 * Menangani Login, Logout, Registrasi, dan Keamanan Data
 */

// --- UTILITIES (ENKRIPSI) ---

// Membuat kode acak (Salt) untuk memperkuat password agar unik per user
function generateSalt(length = 16) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var salt = '';
  for (var i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

// Menghitung Hash SHA-256 dari Password + Salt
// Password tidak pernah disimpan dalam bentuk teks biasa
function computeHash(password, salt) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  var txtHash = '';
  for (i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length == 1) {
      txtHash += '0';
    }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

// --- CORE FUNCTIONS (USER MANAGEMENT) ---

/**
 * Mendaftarkan User Baru (Internal Use Only / Admin Feature)
 */
function registerUser(username, password, role, unitKerja = "") {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME.USERS);
  
  // Cek apakah username sudah ada
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return createErrorResponse("Username sudah terdaftar!");
    }
  }

  // Proses Enkripsi
  const salt = generateSalt();
  const passwordHash = computeHash(password, salt);

  // Simpan ke Database
  sheet.appendRow([
    username,       // A: Username
    passwordHash,   // B: Password Hash (Aman)
    salt,           // C: Salt
    role,           // D: Role (SuperAdmin/AdminUnit)
    unitKerja,      // E: Unit Kerja
    "",             // F: Token (Kosong dulu)
    ""              // G: Last Login
  ]);

  return createSuccessResponse(null, `User ${username} berhasil dibuat.`);
}

/**
 * Login User
 * Memverifikasi password dan membuat token sesi baru
 */
function authenticateUser(username, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME.USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dbUsername = row[0];
    
    if (dbUsername === username) {
      const dbHash = row[1];
      const dbSalt = row[2];
      
      // Cek Password
      const inputHash = computeHash(password, dbSalt);
      
      if (inputHash === dbHash) {
        // Login Sukses! Generate Token Sesi
        const token = Utilities.getUuid();
        const now = new Date();
        
        // Simpan Token & Waktu Login ke Sheet (Update Baris)
        // Baris i+1 karena array mulai dari 0 tapi sheet mulai dari 1
        sheet.getRange(i + 1, 6).setValue(token); // Kolom F
        sheet.getRange(i + 1, 7).setValue(now);   // Kolom G
        
        return createSuccessResponse({
          username: username,
          role: row[3],
          unit_kerja: row[4],
          token: token
        }, "Login Berhasil");
      }
    }
  }
  
  return createErrorResponse("Username atau Password salah.");
}

/**
 * Verifikasi Token
 * Digunakan untuk mengamankan endpoint API lain agar hanya bisa diakses user login
 */
function verifyToken(token) {
  if (!token) return null;
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME.USERS);
  const data = sheet.getDataRange().getValues();
  
  // Loop cari token (Kolom F adalah index 5)
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === token) {
      return {
        username: data[i][0],
        role: data[i][3],
        unit_kerja: data[i][4]
      };
    }
  }
  return null; // Token tidak valid atau kadaluarsa
}

/**
 * Ganti Password / Reset Password
 * Memungkinkan user mengganti password sendiri atau SuperAdmin mereset password orang lain
 */
function changePassword(token, jsonData) {
  // 1. Verifikasi Siapa yang Meminta
  const requestor = verifyToken(token); 
  if (!requestor) return createErrorResponse("Akses ditolak. Token tidak valid/kadaluarsa.");

  try {
    const payload = JSON.parse(jsonData); 
    // Payload expected: { target_username: "...", new_password: "..." }
    
    const targetUsername = payload.target_username;
    const newPassword = payload.new_password;

    if (!targetUsername || !newPassword) {
      return createErrorResponse("Data tidak lengkap.");
    }

    // 2. Cek Izin (Authorization)
    // User hanya boleh ganti password sendiri, KECUALI dia adalah SuperAdmin
    if (requestor.username !== targetUsername && requestor.role !== 'SuperAdmin') {
      return createErrorResponse("Anda tidak memiliki izin untuk mereset password user ini.");
    }

    // 3. Proses Update di Sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME.USERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === targetUsername) {
        // Buat Salt Baru & Hash Baru
        const newSalt = generateSalt();
        const newHash = computeHash(newPassword, newSalt);

        // Update Kolom B (Hash) dan C (Salt)
        // Baris Excel = i + 1
        sheet.getRange(i + 1, 2).setValue(newHash); // Kolom Password_Hash
        sheet.getRange(i + 1, 3).setValue(newSalt); // Kolom Salt

        return createSuccessResponse(null, `Password untuk ${targetUsername} berhasil diubah.`);
      }
    }

    return createErrorResponse("User target tidak ditemukan.");

  } catch (error) {
    return createErrorResponse("Gagal mengubah password: " + error.message);
  }
}

// --- FUNGSI BANTUAN UNTUK MEMBUAT ADMIN PERTAMA ---
// Jalankan fungsi ini sekali saja dari Editor Apps Script untuk membuat akun Anda.
function manualRegisterAdmin() {
  // Ganti "admin" dan "admin123" dengan username/password yang Anda mau.
  const result = registerUser("admin", "admin123", "SuperAdmin", ""); 
  Logger.log(result.getContent());
}