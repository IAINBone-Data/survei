import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- KONFIGURASI LOGO ---
const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTu63u9JEhCETNq-zJ4D6qoWzn3r0lfBDEL53fgzI2N6N4dl-bpHvNv75AqTNGzzM1RZMR9w_-A8NInqJSwppP94NfF6HTkKSw6YTvAgk4u41mvKocOBbkJC0Z9OBT-PrX3hsnQ9RVTSsM0t6i4mDB0G9Xq7niVrzsJ_BtX5vC_74eyBSecS3xgtJ8RUQ/s1538/logoiainbone%20-%20Copy%20(2).png";

const getLogoBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous'); 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generatePDF = async (dataResponden, filterUnit, filterSemester) => {
  if (!dataResponden || dataResponden.length === 0) {
    alert("Tidak ada data untuk dicetak!");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const logoData = await getLogoBase64(LOGO_URL);

  if (logoData) {
    doc.addImage(logoData, 'PNG', 15, 8, 22, 22);
  }

  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.text("KEMENTERIAN AGAMA REPUBLIK INDONESIA", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text("INSTITUT AGAMA ISLAM NEGERI (IAIN) BONE", pageWidth / 2, 22, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text("Jl. Hos Cokroaminoto, Watampone, Kabupaten Bone, Sulawesi Selatan", pageWidth / 2, 28, { align: "center" });
  doc.text("Website: www.iain-bone.ac.id | Email: info@iain-bone.ac.id", pageWidth / 2, 33, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(15, 36, pageWidth - 15, 36);

  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("LAPORAN INDEKS KEPUASAN MASYARAKAT (IKM)", pageWidth / 2, 48, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`Unit Layanan : ${filterUnit === 'Semua' ? 'Seluruh Unit IAIN Bone' : filterUnit}`, 15, 58);
  doc.text(`Periode          : ${filterSemester === 'Semua' ? 'Semua Periode' : filterSemester}`, 15, 64);
  doc.text(`Jumlah Data   : ${dataResponden.length} Responden`, 15, 70);

  const unsurList = [
    { key: 'u1', kode: 'U1', nama: 'Persyaratan' }, 
    { key: 'u2', kode: 'U2', nama: 'Prosedur' }, 
    { key: 'u3', kode: 'U3', nama: 'Waktu Pelayanan' },
    { key: 'u4', kode: 'U4', nama: 'Biaya / Tarif' }, 
    { key: 'u5', kode: 'U5', nama: 'Produk Layanan' }, 
    { key: 'u6', kode: 'U6', nama: 'Kompetensi Pelaksana' },
    { key: 'u7', kode: 'U7', nama: 'Perilaku Pelaksana' }, 
    { key: 'u8', kode: 'U8', nama: 'Sarana Prasarana' }, 
    { key: 'u9', kode: 'U9', nama: 'Penanganan Pengaduan' },
  ];

  let totalNRR = 0;
  const tableRows = [];

  unsurList.forEach((unsur) => {
    // Hitung rata-rata per unsur menggunakan data asli (u1..u9)
    const sumUnsur = dataResponden.reduce((acc, curr) => acc + (parseFloat(curr[unsur.key]) || 0), 0);
    const avgUnsur = sumUnsur / dataResponden.length;
    
    // NRR Tertimbang (Bobot 0.111 untuk 9 unsur)
    const nrrTertimbang = avgUnsur * 0.111;
    totalNRR += nrrTertimbang;

    tableRows.push([
      unsur.kode, unsur.nama, avgUnsur.toFixed(2), nrrTertimbang.toFixed(3), getMutuLabel(avgUnsur * 25) 
    ]);
  });

  const nilaiIKM = totalNRR * 25;
  const mutuPelayanan = getMutuHuruf(nilaiIKM);
  const kinerjaUnit = getMutuKinerja(nilaiIKM);

  autoTable(doc, {
    startY: 75,
    head: [['Kode', 'Unsur Pelayanan', 'Nilai Rata-rata', 'NRR Tertimbang', 'Kategori']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    styles: { fontSize: 10, cellPadding: 2 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setDrawColor(0);
  doc.setFillColor(240, 253, 244);
  doc.rect(15, finalY, pageWidth - 30, 35, 'FD');

  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.text("KESIMPULAN HASIL SURVEI", pageWidth / 2, finalY + 8, { align: "center" });

  doc.setFontSize(12);
  doc.text(`NILAI IKM: ${nilaiIKM.toFixed(2)}`, 25, finalY + 20);
  doc.text(`MUTU PELAYANAN: ${mutuPelayanan}`, pageWidth / 2, finalY + 20, { align: "center" });
  doc.text(`KINERJA: ${kinerjaUnit}`, pageWidth - 25, finalY + 20, { align: "right" });

  const signY = finalY + 50;
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`Watampone, ${today}`, pageWidth - 50, signY, { align: "center" });
  doc.text("Mengetahui,", pageWidth - 50, signY + 6, { align: "center" });
  doc.text("Pimpinan Unit", pageWidth - 50, signY + 11, { align: "center" });
  doc.text("( ..................................... )", pageWidth - 50, signY + 35, { align: "center" });

  doc.save(`Laporan_SKM_${filterUnit}_${new Date().getTime()}.pdf`);
};

function getMutuHuruf(nilai) {
  if (nilai >= 88.31) return 'A'; else if (nilai >= 76.61) return 'B'; else if (nilai >= 65.00) return 'C'; return 'D';
}
function getMutuKinerja(nilai) {
  if (nilai >= 88.31) return 'SANGAT BAIK'; else if (nilai >= 76.61) return 'BAIK'; else if (nilai >= 65.00) return 'KURANG BAIK'; return 'TIDAK BAIK';
}
function getMutuLabel(nilai) {
  if (nilai >= 88.31) return 'Sangat Baik'; else if (nilai >= 76.61) return 'Baik'; else if (nilai >= 65.00) return 'Kurang Baik'; return 'Tidak Baik';
}