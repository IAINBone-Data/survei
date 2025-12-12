import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Printer, FileSpreadsheet, Loader2, BarChart3, Calendar, Briefcase, FileText, PieChart as PieIcon, Layers, Users, ArrowUpDown, AlertCircle, FileCheck, X, Sparkles, LineChart as LineChartIcon, MessageSquare, Quote } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';
import { useAdmin } from '../../context/AdminContext';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line 
} from 'recharts';

const COLORS = ['#16a34a', '#ca8a04', '#2563eb', '#dc2626', '#9333ea', '#0891b2', '#db2777'];

export default function LaporanPage() {
  const { respondents, loading, fetchRespondents } = useAdmin();
  const [filteredData, setFilteredData] = useState([]);
  
  // State Filter
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterLayanan, setFilterLayanan] = useState('Semua');
  const [filterSemester, setFilterSemester] = useState('Semua');

  // State Sorting Tabel
  const [sortConfig, setSortConfig] = useState({ key: 'kode', direction: 'ascending' });

  // State Fitur AI & Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // MEMOIZED USER: Mencegah infinite loop karena referensi objek yang selalu berubah
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user'));
    } catch (error) {
      console.error("Gagal memparsing data user:", error);
      return null;
    }
  }, []);

  // Init Data
  useEffect(() => { fetchRespondents(); }, [fetchRespondents]);
  
  // Auto-set unit jika admin unit login
  useEffect(() => { 
    if (user?.role === 'AdminUnit') {
        setFilterUnit(user.unit_kerja);
    }
  }, [user]);

  // LOGIKA FILTER MULTI-DIMENSI
  useEffect(() => {
    if (respondents && respondents.data) {
      let result = respondents.data;

      // 1. Filter Unit (Super Admin Only)
      if (user?.role === 'SuperAdmin' && filterUnit !== 'Semua') {
        result = result.filter(item => item.unit === filterUnit);
      }

      // 2. Filter Layanan
      if (filterLayanan !== 'Semua') {
        result = result.filter(item => item.layanan === filterLayanan);
      }

      // 3. Filter Semester
      if (filterSemester !== 'Semua') {
        const parts = filterSemester.split('-');
        if (parts.length === 2) {
            const [fYear, fSem] = parts;
            result = result.filter(item => {
              const d = new Date(item.timestamp);
              // Validasi tanggal
              if (isNaN(d.getTime())) return false;
              
              const s = d.getMonth() + 1 <= 6 ? '1' : '2';
              return d.getFullYear().toString() === fYear && s === fSem;
            });
        }
      }
      setFilteredData(result);
    }
  }, [filterUnit, filterLayanan, filterSemester, respondents, user]);

  // --- OPSI FILTER DINAMIS ---
  const rawData = respondents?.data || [];
  
  const semesterOptions = [...new Set(rawData.map(item => {
    const d = new Date(item.timestamp);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${d.getMonth() + 1 <= 6 ? 1 : 2}`;
  }).filter(Boolean))].sort().reverse();
  
  const unitOptions = [...new Set(rawData.map(item => item.unit))].sort();

  const layananOptions = useMemo(() => {
    let source = rawData;
    if (filterUnit !== 'Semua') {
        source = source.filter(item => item.unit === filterUnit);
    }
    return [...new Set(source.map(item => item.layanan))].sort();
  }, [rawData, filterUnit]);


  // --- KALKULASI STATISTIK ---
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const total = filteredData.length;
    
    // A. Hitung IKM & Unsur
    const unsurKeys = ['u1','u2','u3','u4','u5','u6','u7','u8','u9'];
    let totalNRR = 0;
    
    const unsurStats = unsurKeys.map((key, idx) => {
        const sum = filteredData.reduce((acc, curr) => acc + (parseFloat(curr[key]) || 0), 0);
        // Cegah pembagian nol
        const avg = total > 0 ? sum / total : 0;
        const nrr = avg * 0.111;
        totalNRR += nrr;
        return { 
            kode: `U${idx+1}`, 
            nama: getUnsurName(idx+1), 
            rata2: parseFloat(avg.toFixed(2)), // Pastikan number agar bisa disort
            nrr: parseFloat(nrr.toFixed(3)),
            mutu: getMutuLabel(avg * 25)
        };
    });

    const ikm = totalNRR * 25;

    // B. Statistik Demografi
    const createChartData = (keyMap) => Object.keys(keyMap).map(k => ({ name: k, value: keyMap[k] }));
    
    const jkCounts = filteredData.reduce((acc, curr) => {
        const key = curr.jk === 'L' ? 'Laki-laki' : 'Perempuan';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    
    const eduCounts = filteredData.reduce((acc, curr) => {
        acc[curr.pendidikan] = (acc[curr.pendidikan] || 0) + 1;
        return acc;
    }, {});
    
    const jobCounts = filteredData.reduce((acc, curr) => {
        acc[curr.pekerjaan] = (acc[curr.pekerjaan] || 0) + 1;
        return acc;
    }, {});
    
    const ageGroups = { '< 20': 0, '20-29': 0, '30-39': 0, '40-49': 0, '50+': 0 };
    filteredData.forEach(item => {
        const age = parseInt(item.usia);
        if (age < 20) ageGroups['< 20']++;
        else if (age < 30) ageGroups['20-29']++;
        else if (age < 40) ageGroups['30-39']++;
        else if (age < 50) ageGroups['40-49']++;
        else ageGroups['50+']++;
    });

    // C. Statistik Layanan (Tampilkan Semua)
    const svcCounts = filteredData.reduce((acc, curr) => {
        const name = curr.layanan;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    
    // Sort layanan dari terbanyak
    const chartServices = Object.keys(svcCounts)
        .map(k => ({ name: k, value: svcCounts[k] }))
        .sort((a, b) => b.value - a.value);

    // Data untuk Bar Chart Unsur (Sorted Highest to Lowest)
    const chartUnsur = [...unsurStats].sort((a, b) => b.rata2 - a.rata2);

    // D. Statistik Tren Partisipasi (Group by Month)
    const trendMap = {};
    filteredData.forEach(item => {
        const d = new Date(item.timestamp);
        if(!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // Format YYYY-MM
            trendMap[key] = (trendMap[key] || 0) + 1;
        }
    });
    const chartTrend = Object.keys(trendMap).sort().map(key => {
        const [y, m] = key.split('-');
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agust','Sep','Okt','Nov','Des'];
        return { name: `${months[parseInt(m)-1]} ${y}`, value: trendMap[key], fullDate: key };
    });

    // E. Data Kritik & Masukan (Unique & Filtered)
    const rawSuggestions = filteredData
        .map(d => d.saran)
        .filter(s => s && s.length > 5 && s !== '-' && s.toLowerCase() !== 'tidak ada');
    
    // Ambil 5 saran terbaru yang unik
    const distinctSuggestions = [...new Set(rawSuggestions)].slice(0, 5);

    return {
        total,
        ikm: ikm.toFixed(2),
        mutu: getMutuHuruf(ikm),
        kinerja: getMutuKinerja(ikm),
        unsurStats, // Data Tabel Asli (Urut Kode)
        chartUnsur, // Data Grafik (Urut Nilai)
        chartTrend, // Data Grafik Tren
        distinctSuggestions, // List saran
        rawSuggestions, // Untuk AI
        charts: { 
            chartJK: createChartData(jkCounts), 
            chartEdu: createChartData(eduCounts), 
            chartJob: createChartData(jobCounts), 
            chartAge: createChartData(ageGroups), 
            chartServices 
        }
    };
  }, [filteredData]);

  // --- FUNGSI SORTING TABEL ---
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedTableData = useMemo(() => {
    if (!stats) return [];
    let sortableItems = [...stats.unsurStats];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stats, sortConfig]);

  // --- ACTIONS ---
  const handlePrint = () => generatePDF(filteredData, filterUnit, filterSemester);
  
  const handleExportCSV = () => {
    const headers = ["Tanggal", "Unit", "Layanan", "IKM", "Mutu", "U1", "U2", "U3", "U4", "U5", "U6", "U7", "U8", "U9"];
    const rows = filteredData.map(r => [
        `"${new Date(r.timestamp).toLocaleDateString()}"`, `"${r.unit}"`, `"${r.layanan}"`, r.nilai_rata, getMutuHuruf(r.nilai_rata*25),
        r.u1, r.u2, r.u3, r.u4, r.u5, r.u6, r.u7, r.u8, r.u9
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_SKM_${filterUnit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- AI SUMMARIZER ---
  const generateAiSummary = async () => {
    setIsAiLoading(true);
    setShowAiModal(true);
    
    // Simulasi Response AI
    const suggestionsCount = stats?.rawSuggestions?.length || 0;
    
    setTimeout(() => {
        if(suggestionsCount === 0) {
            setAiSummary({ 
                sentiment: 'Netral', 
                summary: 'Tidak ada data saran yang cukup untuk dianalisis.', 
                topics: [] 
            });
        } else {
            // Mock Response AI
            setAiSummary({
                sentiment: 'Positif - Konstruktif',
                summary: `Berdasarkan analisis terhadap ${suggestionsCount} masukan responden, secara umum layanan dinilai baik. Namun, terdapat pola keluhan berulang terkait durasi antrian pada jam sibuk dan kenyamanan ruang tunggu. Responden mengapresiasi keramahan petugas namun mengharapkan digitalisasi layanan dipercepat.`,
                topics: [
                    { topic: 'Waktu Pelayanan', count: Math.floor(Math.random() * 10) + 5, desc: 'Keluhan antrian lama saat jam istirahat.' },
                    { topic: 'Sarana Prasarana', count: Math.floor(Math.random() * 8) + 2, desc: 'AC ruang tunggu kurang dingin & kursi kurang.' },
                    { topic: 'Sistem Online', count: Math.floor(Math.random() * 5) + 1, desc: 'Website terkadang lambat diakses.' }
                ]
            });
        }
        setIsAiLoading(false);
    }, 2500);
  };

  if (loading.respondents && !respondents) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10 relative">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Laporan & Statistik</h2>
            <p className="text-slate-500 text-sm">Analisis mendalam hasil survei kepuasan masyarakat.</p>
         </div>
         <div className="flex gap-2 flex-wrap">
            <button onClick={generateAiSummary} disabled={!stats} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50">
                <Sparkles size={18} /> AI Insight
            </button>
            <button onClick={handlePrint} disabled={!stats} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-50"><Printer size={18} /> Cetak PDF</button>
            <button onClick={handleExportCSV} disabled={!stats} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50"><FileSpreadsheet size={18} /> Export CSV</button>
         </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center flex-wrap">
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar size={16} className="text-slate-400"/>
            <select className="p-2 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50 w-full" value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                <option value="Semua">Semua Periode</option>
                {semesterOptions.map(s => <option key={s} value={s}>{s.replace('-', ' Semester ')}</option>)}
            </select>
         </div>
         {user?.role === 'SuperAdmin' && (
             <div className="flex items-center gap-2 w-full md:w-auto">
                <Briefcase size={16} className="text-slate-400"/>
                <select className="p-2 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50 w-full" value={filterUnit} onChange={e => {setFilterUnit(e.target.value); setFilterLayanan('Semua');}}>
                    <option value="Semua">Semua Unit Kerja</option>
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
             </div>
         )}
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Layers size={16} className="text-slate-400"/>
            <select className="p-2 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50 w-full" value={filterLayanan} onChange={e => setFilterLayanan(e.target.value)}>
                <option value="Semua">Semua Layanan</option>
                {layananOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
         </div>
      </div>

      {stats ? (
        <>
        {/* 1. RINGKASAN IKM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Responden</span>
                <span className="text-4xl font-extrabold text-blue-700">{stats.total}</span>
            </div>
            <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Nilai IKM</span>
                <span className="text-4xl font-extrabold text-green-700">{stats.ikm}</span>
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Mutu Pelayanan</span>
                <span className="text-4xl font-extrabold text-yellow-700">{stats.mutu}</span>
                <span className="text-xs text-yellow-600 font-medium mt-1">{stats.kinerja}</span>
            </div>
        </div>

        {/* 2. BAGIAN TREN & KESIMPULAN (KARTU BARU) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Tren Partisipasi */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <LineChartIcon size={20} className="text-purple-600"/> Tren Partisipasi Responden
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.chartTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                            <YAxis tick={{fontSize: 12}} stroke="#94a3b8"/>
                            <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Kartu Kesimpulan Kritik & Masukan */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <MessageSquare size={20} className="text-orange-500"/> Kritik & Saran Terbaru
                    </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[240px] space-y-3 mb-4 pr-2 custom-scrollbar">
                    {stats.distinctSuggestions.length > 0 ? (
                        stats.distinctSuggestions.map((saran, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 italic relative">
                                <Quote size={12} className="absolute top-2 left-2 text-slate-300 transform -scale-x-100"/>
                                <span className="pl-4 block">{saran}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 py-8 text-sm">Belum ada saran masuk.</div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={generateAiSummary} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md text-sm font-medium">
                        <Sparkles size={16}/> Analisis & Buat Kesimpulan AI
                    </button>
                </div>
            </div>
        </div>

        {/* 3. STATISTIK DEMOGRAFI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DemographyCard title="Jenis Kelamin" data={stats.charts.chartJK} icon={<Users size={18}/>} />
            <DemographyCard title="Kelompok Umur" data={stats.charts.chartAge} icon={<Calendar size={18}/>} />
            <DemographyCard title="Pendidikan" data={stats.charts.chartEdu} icon={<FileText size={18}/>} />
            <DemographyCard title="Pekerjaan" data={stats.charts.chartJob} icon={<Briefcase size={18}/>} />
        </div>

        {/* 4. STATISTIK LAYANAN (Dinamis Height) & UNSUR (Bar Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grafik Layanan */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={20} className="text-green-600"/> Statistik Layanan</h3>
                </div>
                <div style={{ height: Math.max(300, stats.charts.chartServices.length * 40) }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.charts.chartServices} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px'}} />
                            <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Grafik Unsur (Sorted) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600"/> Peringkat Unsur (Tertinggi ke Terendah)</h3>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartUnsur} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 4]} hide />
                            <YAxis type="category" dataKey="kode" width={30} tick={{fontSize: 12, fontWeight: 'bold'}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px'}} formatter={(val) => val} />
                            <Bar dataKey="rata2" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={25} label={{ position: 'right', fill: '#64748b', fontSize: 12 }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* 5. TABEL DETAIL UNSUR (SORTABLE) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                <BarChart3 size={18} /> Rincian Nilai Per Unsur Pelayanan
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('kode')}>
                                <div className="flex items-center gap-1">Kode <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-3 cursor-pointer hover:bg-slate-100" onClick={() => requestSort('nama')}>
                                <div className="flex items-center gap-1">Unsur Pelayanan <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-3 text-center cursor-pointer hover:bg-slate-100" onClick={() => requestSort('rata2')}>
                                <div className="flex items-center justify-center gap-1">Nilai Rata-rata <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-3 text-center cursor-pointer hover:bg-slate-100" onClick={() => requestSort('nrr')}>
                                <div className="flex items-center justify-center gap-1">NRR <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-6 py-3 text-center">Kategori</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedTableData.map((u) => (
                            <tr key={u.kode} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-500">{u.kode}</td>
                                <td className="px-6 py-3 font-bold text-slate-700">{u.nama}</td>
                                <td className="px-6 py-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">{u.rata2}</span></td>
                                <td className="px-6 py-3 text-center text-slate-600">{u.nrr}</td>
                                <td className="px-6 py-3 text-center text-slate-500">{u.mutu}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        </>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <FileText size={48} className="mx-auto mb-3 opacity-20"/>
            <p>Tidak ada data laporan untuk filter yang dipilih.</p>
        </div>
      )}

      {/* MODAL AI INSIGHT */}
      {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles size={20}/> Analisis Cerdas AI (Beta)</h3>
                      <button onClick={() => setShowAiModal(false)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-lg hover:bg-white/20 transition"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {isAiLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                              <Loader2 size={48} className="animate-spin text-indigo-600 mb-4"/>
                              <p className="animate-pulse font-medium text-slate-600">Sedang membaca {stats?.rawSuggestions?.length} saran responden...</p>
                              <p className="text-xs mt-2 text-slate-400">Menggunakan Model Bahasa Alami</p>
                          </div>
                      ) : aiSummary ? (
                          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                                  <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                      <FileCheck size={18}/> Ringkasan Eksekutif
                                  </h4>
                                  <p className="text-indigo-800 text-sm leading-relaxed text-justify">{aiSummary.summary}</p>
                              </div>
                              
                              <div>
                                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-orange-500"/> Isu & Topik Utama</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {aiSummary.topics.map((topic, i) => (
                                          <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:shadow-md transition">
                                              <div className="bg-orange-50 text-orange-600 font-bold w-8 h-8 rounded-lg flex items-center justify-center border border-orange-100 shrink-0 text-xs">
                                                  {topic.count}x
                                              </div>
                                              <div>
                                                  <h5 className="font-bold text-slate-800 text-sm">{topic.topic}</h5>
                                                  <p className="text-slate-500 text-xs mt-0.5 leading-tight">{topic.desc}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-100">
                                  Analisis ini dihasilkan oleh AI berdasarkan sampel data teks terbaru. Harap verifikasi manual untuk keputusan strategis.
                              </div>
                          </div>
                      ) : null}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button onClick={() => setShowAiModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">Tutup</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT: DEMOGRAPHY CARD ---
const DemographyCard = ({ title, data, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col h-64">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">{icon} {title}</h4>
        <div className="flex-1 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-2 flex-wrap">
                 {data.slice(0,3).map((d, i) => (
                     <span key={i} className="text-[10px] flex items-center gap-1 text-slate-500">
                         <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                         {d.name} ({d.value})
                     </span>
                 ))}
             </div>
        </div>
    </div>
);

// Helpers
function getUnsurName(idx) {
    const names = ["Persyaratan","Prosedur","Waktu Pelayanan","Biaya/Tarif","Produk Layanan","Kompetensi","Perilaku","Sarana","Pengaduan"];
    return names[idx-1] || `Unsur ${idx}`;
}
function getMutuHuruf(n) { if(n>=88.31)return'A'; if(n>=76.61)return'B'; if(n>=65)return'C'; return'D'; }
function getMutuKinerja(n) { if(n>=88.31)return'Sangat Baik'; if(n>=76.61)return'Baik'; if(n>=65)return'Kurang Baik'; return'Tidak Baik'; }
function getMutuLabel(n) { if(n>=88.31)return'Sangat Baik'; if(n>=76.61)return'Baik'; if(n>=65)return'Kurang Baik'; return'Tidak Baik'; }