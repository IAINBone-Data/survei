import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Download, Trash2, FileSpreadsheet, Loader2, AlertCircle, ChevronLeft, ChevronRight, Printer, Target, Info, Settings, RefreshCcw } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';
import { useAdmin } from '../../context/AdminContext';

// URL API Backend (Pastikan URL ini benar)
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec";

export default function DataResponden() {
  const { respondents, loading, fetchRespondents, removeRespondentLocal } = useAdmin();
  
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  
  // State Filter
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterLayanan, setFilterLayanan] = useState('Semua');
  const [filterSemester, setFilterSemester] = useState('Semua');
  
  // State Populasi (Data dari Sheet db_settings)
  const [populationSettings, setPopulationSettings] = useState({});
  const [isPopLoading, setIsPopLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
  }, []);

  // --- 1. FETCH DATA (Responden & Populasi) ---
  useEffect(() => {
    fetchRespondents();
    fetchPopulationData();
  }, [fetchRespondents]);

  const fetchPopulationData = async () => {
    try {
      // Ambil data dari Backend (Action: getSettingsData)
      const response = await fetch(`${API_URL}?action=getSettingsData`);
      const result = await response.json();
      if (result.status === 'success') {
        setPopulationSettings(result.data); // Simpan { 'Fakultas A': 300, ... }
      }
    } catch (error) {
      console.error("Gagal ambil populasi:", error);
    } finally {
      setIsPopLoading(false);
    }
  };

  // --- 2. LOGIKA FILTERING ---
  useEffect(() => {
    if (respondents && respondents.data) {
      let result = respondents.data;

      // Filter Search
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(item => 
          (item.layanan && item.layanan.toLowerCase().includes(q)) ||
          (item.saran && item.saran.toLowerCase().includes(q)) ||
          (item.unit && item.unit.toLowerCase().includes(q))
        );
      }

      // Filter Unit (SuperAdmin)
      if (user?.role === 'SuperAdmin' && filterUnit !== 'Semua') {
        result = result.filter(item => item.unit === filterUnit);
      } else if (user?.role === 'AdminUnit') {
        // Force filter untuk Admin Unit
        result = result.filter(item => item.unit === user.unit_kerja);
      }

      // Filter Layanan
      if (filterLayanan !== 'Semua') {
        result = result.filter(item => item.layanan === filterLayanan);
      }

      // Filter Semester
      if (filterSemester !== 'Semua') {
        result = result.filter(item => {
          const date = new Date(item.timestamp);
          const month = date.getMonth() + 1; 
          const year = date.getFullYear();
          const [filterYear, filterSem] = filterSemester.split('-');
          if (year.toString() !== filterYear) return false;
          if (filterSem === '1') return month <= 6; 
          if (filterSem === '2') return month > 6; 
          return true;
        });
      }
      
      setFilteredData(result);
      setCurrentPage(1); 
    }
  }, [search, filterUnit, filterLayanan, filterSemester, respondents, user]);

  // --- 3. LOGIKA TARGET POPULASI ---
  const currentUnitKey = user?.role === 'AdminUnit' ? user.unit_kerja : filterUnit;
  
  const currentPopulation = useMemo(() => {
    // Ambil populasi unit yang sedang dipilih. Jika 'Semua', ambil key 'Semua'.
    return populationSettings[currentUnitKey] || 0;
  }, [populationSettings, currentUnitKey]);

  const targetSampel = useMemo(() => {
    const N = currentPopulation;
    if (N <= 0) return 0;
    // Rumus Krejcie & Morgan (Chi-Square=3.841, P=0.5, d=0.05)
    const X2 = 3.841;
    const P = 0.5;
    const d = 0.05;
    const S = (X2 * N * P * (1 - P)) / ((d * d * (N - 1)) + (X2 * P * (1 - P)));
    return Math.ceil(S);
  }, [currentPopulation]);

  const totalRespondenFiltered = filteredData.length;
  const progressPercent = targetSampel > 0 ? Math.min((totalRespondenFiltered / targetSampel) * 100, 100) : 0;
  const kekurangan = Math.max(0, targetSampel - totalRespondenFiltered);
  const isAchieved = totalRespondenFiltered >= targetSampel;

  const handleSetPopulasi = async () => {
    const labelUnit = currentUnitKey === 'Semua' ? 'Global (Total Instansi)' : currentUnitKey;
    const ip = window.prompt(
      `Atur Populasi: ${labelUnit}\n\nMasukkan jumlah populasi pengguna layanan untuk unit ini. Data akan disimpan di Database.`, 
      currentPopulation > 0 ? currentPopulation : ''
    );

    if (ip !== null && ip.trim() !== '') {
      const parsedIp = parseInt(ip);
      if (!isNaN(parsedIp) && parsedIp >= 0) {
        // Optimistic Update
        setPopulationSettings(prev => ({ ...prev, [currentUnitKey]: parsedIp }));
        
        // Kirim ke Backend
        try {
          const formData = new FormData();
          formData.append('action', 'updatePopulation');
          formData.append('unit', currentUnitKey);
          formData.append('value', parsedIp);
          
          await fetch(API_URL, { method: 'POST', body: formData });
          // alert("Populasi berhasil disimpan!");
        } catch (e) {
          alert("Gagal menyimpan ke server: " + e.message);
        }
      } else {
        alert('Masukkan angka yang valid.');
      }
    }
  };

  // --- 4. EXPORT & PRINT ---
  const handleExport = () => { /* ... existing export logic ... */ };
  const handlePrintPDF = () => { generatePDF(filteredData, filterUnit, filterSemester); };

  const handleDelete = async (id, rowIndex) => {
    if(!confirm("Yakin ingin menghapus data ini? Tindakan ini permanen.")) return;
    removeRespondentLocal(id);
    const token = localStorage.getItem('admin_token');
    await fetch(`${API_URL}?action=deleteData&token=${token}&id=${rowIndex}`);
  };

  // Fungsi Reset Filter
  const handleResetFilter = () => {
    setSearch('');
    setFilterUnit(user?.role === 'AdminUnit' ? user.unit_kerja : 'Semua');
    setFilterLayanan('Semua');
    setFilterSemester('Semua');
  };

  // Pagination & Options
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const rawData = respondents?.data || [];
  const semesterOptions = [...new Set(rawData.map(item => {
    const d = new Date(item.timestamp);
    const y = d.getFullYear();
    const s = d.getMonth() + 1 <= 6 ? 1 : 2;
    return `${y}-${s}`;
  }))].sort().reverse();
  
  const unitOptions = [...new Set(rawData.map(item => item.unit))].sort();
  const layananOptions = [...new Set(rawData
    .filter(item => filterUnit === 'Semua' || item.unit === filterUnit)
    .map(item => item.layanan)
  )].sort();

  if (loading.respondents && !respondents) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. MONITORING TARGET (PERMENPAN RB) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120} className="text-blue-600"/></div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 relative z-10">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Permenpan RB 14/2017</span>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Info size={12}/> {currentUnitKey === 'Semua' ? 'Target Global' : `Target Unit: ${currentUnitKey}`}
                    </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Status Keterwakilan Responden</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 block mb-1">Populasi Pengguna</span>
                        <div className="flex items-end gap-2">
                            {isPopLoading ? <Loader2 size={16} className="animate-spin text-slate-400"/> : (
                                <span className="text-xl font-bold text-slate-700">{currentPopulation > 0 ? currentPopulation.toLocaleString() : '-'}</span>
                            )}
                            {currentPopulation === 0 && !isPopLoading && <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded font-medium animate-pulse">Belum diatur</span>}
                        </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="text-xs text-blue-600 block font-semibold mb-1">Target Sampel (Min)</span>
                        <span className="text-xl font-bold text-blue-700">{targetSampel.toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-lg border ${isAchieved ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                        <span className={`text-xs block font-semibold mb-1 ${isAchieved ? 'text-green-600' : 'text-orange-600'}`}>{isAchieved ? 'Surplus' : 'Kekurangan'}</span>
                        <span className={`text-xl font-bold ${isAchieved ? 'text-green-700' : 'text-orange-700'}`}>
                            {isAchieved ? `+${totalRespondenFiltered - targetSampel}` : `-${kekurangan}`}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 min-w-[200px]">
                {/* Tombol Atur Populasi (Hanya SuperAdmin atau Admin Unit ybs) */}
                {(user?.role === 'SuperAdmin' || user?.role === 'AdminUnit') && (
                  <button onClick={handleSetPopulasi} className="flex items-center gap-2 text-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition font-medium shadow-sm active:scale-95">
                      <Settings size={14}/> {currentPopulation > 0 ? 'Ubah Populasi' : 'Atur Populasi'}
                  </button>
                )}
                <div className="w-full text-right">
                    <span className="text-4xl font-extrabold text-slate-800">{totalRespondenFiltered}</span>
                    <span className="text-sm text-slate-500 block">Responden Masuk</span>
                </div>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 relative pt-4">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="flex justify-between mt-1 text-xs font-medium text-slate-500">
                <span>0</span>
                <span>Target: {targetSampel}</span>
            </div>
        </div>
      </div>

      {/* 2. FILTER BAR (SATU BARIS + RESET) */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 sticky top-2 z-20 overflow-x-auto no-scrollbar">
        <div className="flex flex-row items-center gap-2 min-w-max">
            {/* Search */}
            <div className="relative w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Cari layanan, saran..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
            </div>

            {/* Filter Periode */}
            <div className="relative w-40">
                <select 
                    className="w-full pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                    value={filterSemester} 
                    onChange={(e) => setFilterSemester(e.target.value)}
                >
                    <option value="Semua">Semua Periode</option>
                    {semesterOptions.map(opt => { const [y, s] = opt.split('-'); return <option key={opt} value={opt}>Tahun {y} - Sem {s}</option> })}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>

            {/* Filter Unit (SuperAdmin) */}
            {user?.role === 'SuperAdmin' && (
              <div className="relative w-48">
                  <select 
                      className="w-full pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                      value={filterUnit} 
                      onChange={(e) => {setFilterUnit(e.target.value); setFilterLayanan('Semua');}}
                  >
                      <option value="Semua">Semua Unit Kerja</option>
                      {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>
            )}

            {/* Filter Layanan */}
            <div className="relative w-48">
                <select 
                    className="w-full pl-2 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                    value={filterLayanan} 
                    onChange={(e) => setFilterLayanan(e.target.value)}
                >
                    <option value="Semua">Semua Layanan</option>
                    {layananOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>

            {/* Tombol Reset */}
            {(search || filterUnit !== (user?.role === 'AdminUnit' ? user.unit_kerja : 'Semua') || filterLayanan !== 'Semua' || filterSemester !== 'Semua') && (
                <button 
                    onClick={handleResetFilter}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-bold transition whitespace-nowrap border border-red-100"
                    title="Reset Filter"
                >
                    <RefreshCcw size={14} /> Reset
                </button>
            )}
        </div>
      </div>

      {/* 3. TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredData.length === 0 ? (<div className="p-12 text-center text-slate-400"><AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Tidak ada data ditemukan.</p></div>) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">Tanggal</th>
                   <th className="px-6 py-4">Unit / Layanan</th>
                   <th className="px-6 py-4">Profil</th>
                   <th className="px-6 py-4 text-center">Nilai Rata2</th>
                   <th className="px-6 py-4 w-1/3">Saran</th>
                   {user?.role === 'SuperAdmin' && <th className="px-6 py-4 text-right">Aksi</th>}
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {paginatedData.map((row) => (
                   <tr key={row.id} className="hover:bg-green-50/50 transition">
                     <td className="px-6 py-4 whitespace-nowrap align-top">{new Date(row.timestamp).toLocaleDateString('id-ID')}</td>
                     <td className="px-6 py-4 align-top"><p className="font-bold text-slate-800">{row.unit}</p><p className="text-xs text-slate-400">{row.layanan}</p></td>
                     <td className="px-6 py-4 align-top"><p>{row.jk === 'L' ? 'Laki-laki' : 'Perempuan'}, {row.usia} Thn</p><p className="text-xs text-slate-400">{row.pekerjaan}</p></td>
                     <td className="px-6 py-4 text-center align-top"><span className={`px-2 py-1 rounded font-bold ${row.nilai_rata >= 3.5 ? 'bg-green-100 text-green-700' : row.nilai_rata >= 2.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{row.nilai_rata}</span></td>
                     <td className="px-6 py-4 align-top whitespace-normal break-words leading-relaxed">{row.saran || '-'}</td>
                     {user?.role === 'SuperAdmin' && (
                       <td className="px-6 py-4 text-right align-top">
                          <button onClick={() => handleDelete(row.id, row.rowIndex)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition" title="Hapus Data"><Trash2 size={16} /></button>
                       </td>
                     )}
                   </tr>))}
               </tbody>
             </table>
           </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (<div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50"><span className="text-xs text-slate-500">Menampilkan {((currentPage-1)*itemsPerPage)+1} - {Math.min(currentPage*itemsPerPage, filteredData.length)} dari {filteredData.length} data</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 bg-white border rounded hover:bg-slate-100 disabled:opacity-50"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 bg-white border rounded hover:bg-slate-100 disabled:opacity-50"><ChevronRight size={16} /></button></div></div>)}
      </div>
    </div>
  );
}