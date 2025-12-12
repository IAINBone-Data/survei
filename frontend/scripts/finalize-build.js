import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup path agar kompatibel Windows/Mac
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

// 1. Copy index.html -> 404.html (Solusi Refresh Error)
try {
    fs.copyFileSync(path.join(distPath, 'index.html'), path.join(distPath, '404.html'));
    console.log('✅ Sukses: 404.html berhasil dibuat (Solusi Refresh GitHub Pages)');
} catch (err) {
    console.error('❌ Gagal membuat 404.html:', err);
}

// 2. Buat .nojekyll (Agar file aset aman)
try {
    fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
    console.log('✅ Sukses: .nojekyll berhasil dibuat');
} catch (err) {
    console.error('❌ Gagal membuat .nojekyll:', err);
}