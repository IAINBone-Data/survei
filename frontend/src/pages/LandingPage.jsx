import React, { useEffect, useState } from 'react';
import { Activity, Award, ChevronRight, ChevronLeft, BarChart3, ShieldCheck, FileText, Download, X, Eye, Loader2, CheckCircle, ArrowLeft, Info, AlertCircle, Calendar, Clock, Globe, Link as LinkIcon, RefreshCcw, Home, Share2 } from 'lucide-react';
import TwibbonModal from '../components/TwibbonModal';

// ==========================================
// KONFIGURASI API (WAJIB DIGANTI)
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec"; // GANTI DENGAN URL WEB APP ANDA
const STATIC_PATH = "data/"; // Path ke file JSON Cache

// --- FUNGSI FETCH ---
const fetchHistory = async () => {
  try {
    const response = await fetch(`${STATIC_PATH}history.json`);
    if (!response.ok) throw new Error("Gagal load cache");
    const json = await response.json();
    return { status: 'success', data: json };
  } catch (error) {
    return { status: "error", message: error.message, data: [] };
  }
};

const fetchConfig = async () => {
  try {
    const response = await fetch(`${STATIC_PATH}config.json`);
    const json = await response.json();
    return { status: 'success', data: json };
  } catch (error) {
    return { status: "error", message: error.message };
  }
};

const fetchServices = async () => {
  try {
    const response = await fetch(`${STATIC_PATH}services.json`);
    const json = await response.json();
    return { status: 'success', data: json };
  } catch (error) {
    return { status: "error", message: error.message };
  }
};

const fetchInfo = async () => {
  try {
    const response = await fetch(`${STATIC_PATH}info.json`);
    const json = await response.json();
    return { status: 'success', data: json };
  } catch (error) {
    return { status: "error", message: error.message, data: {} };
  }
};

// --- FUNGSI SUBMIT ---
const submitSurvey = async (formData) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return { status: "success" };
  } catch (error) {
    console.error("Gagal kirim:", error);
    return { status: "error", message: error.message };
  }
};

// --- HELPER LINK ---
const parseDriveLink = (url) => {
  if (!url || url === '#') return { preview: null, download: null };
  const idMatch = url.match(/\/d\/(.*?)\/|id=(.*?)(&|$)/);
  const fileId = idMatch ? (idMatch[1] || idMatch[2]) : null;
  if (!fileId) return { preview: null, download: url };
  return {
    preview: `https://drive.google.com/file/d/${fileId}/preview`,
    download: `https://drive.google.com/uc?export=download&id=${fileId}`
  };
};

export default function LandingPage() {
  const [view, setView] = useState('landing');
  const [history, setHistory] = useState([]);
  const [info, setInfo] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerSlide = 3;

  const [config, setConfig] = useState([]);
  const [serviceData, setServiceData] = useState({});
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  
  // STATE BARU TWIBBON
  const [showTwibbon, setShowTwibbon] = useState(false);

  const initialFormState = {
    unit_layanan: '', usia: '', jenis_kelamin: '', pendidikan: '', pekerjaan: '', jenis_layanan: '', saran: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [availableServices, setAvailableServices] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [histRes, infoRes] = await Promise.all([fetchHistory(), fetchInfo()]);
      if (histRes.status === 'success' && Array.isArray(histRes.data)) setHistory(histRes.data);
      if (infoRes.status === 'success') setInfo(infoRes.data);
      setLoadingHistory(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (view === 'survey' && (config.length === 0 || Object.keys(serviceData).length === 0)) {
      setLoadingConfig(true);
      Promise.all([fetchConfig(), fetchServices()]).then(([configRes, serviceRes]) => {
        if (configRes.status === 'success') setConfig(configRes.data);
        if (serviceRes.status === 'success') setServiceData(serviceRes.data);
        setLoadingConfig(false);
      });
    }
  }, [view]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'unit_layanan') {
      setAvailableServices(serviceData[value] || []);
      setFormData({ ...formData, [name]: value, jenis_layanan: '' });
    } else if (name === 'usia') {
      if (value.length <= 2) setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleScaleChange = (kode, value) => {
    setFormData(prev => ({ ...prev, [kode.toLowerCase()]: parseInt(value) }));
  };
  
  const resetForm = () => {
    setFormData(initialFormState);
    setFinished(false);
    setSubmitting(false);
    window.scrollTo(0,0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFinished(true);
    window.scrollTo(0,0);

    submitSurvey(formData).then(() => {
       console.log("Data tersimpan di server");
       setSubmitting(false);
    }).catch(err => {
       console.error("Gagal simpan background:", err);
    });
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.ceil(history.length / itemsPerSlide));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + Math.ceil(history.length / itemsPerSlide)) % Math.ceil(history.length / itemsPerSlide));
  const visibleReports = history.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide);

  const getMutuColor = (mutu) => {
    if (mutu === 'A') return 'bg-green-100 text-green-700 border-green-200';
    if (mutu === 'B') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (mutu === 'C') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const FooterIAIN = () => (
    // POIN 2: Margin bawah dinaikkan khusus mobile (mb-10) dan direset di desktop (md:mb-0)
    <footer className="bg-green-900 text-green-50 py-12 border-t border-green-800 mb-10 md:mb-0">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center md:text-left">
           <div className="bg-white p-2 rounded-lg inline-block mb-4">
             <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirtCL38l8xSTAvcT1GScchzPGsMvWcLH_aM3i80yhEgbA1r7ah4SqLT-wF8t4XHh_2p-kUuGcmpujoNiCPdGglnuZ1u2Xt_KFdQzsTtCrGHRQ2al0Bthge_VqSyo_xi_83M90TxoBbZW7nLmVqtGkGhZ886MFPqpeTx9TXMkxQ7rBJO_yqYF7jgBvoQeg/s253/logoskm-iain.png" alt="Logo" className="h-10 w-auto" />
           </div>
           <h4 className="font-bold text-lg text-white">Institut Agama Islam Negeri Bone</h4>
           <p className="text-sm opacity-80 mt-2 leading-relaxed">Layanan IAIN Bone - Survei Kepuasan Masyarakat.</p>
        </div>
        <div className="text-center md:text-left">
           <h4 className="font-bold text-lg text-white mb-4 border-b border-green-700 pb-2 inline-block md:block">Tautan Penting</h4>
           <ul className="space-y-3 text-sm">
             <li><a href="https://iain-bone.ac.id" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition">Website IAIN Bone</a></li>
             <li><a href="https://layanan.iain-bone.ac.id" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition">Layanan IAIN Bone</a></li>
             <li><a href="https://ppid.iain-bone.ac.id" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition">PPID IAIN Bone</a></li>
           </ul>
        </div>
        <div className="text-center md:text-right flex flex-col justify-between">
           <div><h4 className="font-bold text-lg text-white mb-2">Kontak</h4><p className="text-sm opacity-80">Jl. Hos Cokroaminoto, Watampone</p><p className="text-xs opacity-60 mt-6">&copy; {new Date().getFullYear()} Layanan IAIN Bone ♥️ Biro AUAK IAIN Bone</p></div>
           
        </div>
      </div>
    </footer>
  );

  if (view === 'survey') {
    return (
      <div className="min-h-screen bg-slate-50 py-8 font-sans text-slate-800 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          
          {/* HEADER GABUNGAN (JUDUL + PETUNJUK) - Disembunyikan saat Selesai */}
          {!finished && (
            <div className="bg-green-600 rounded-xl shadow-lg p-6 md:p-8 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="relative z-10">
                    <button 
                        onClick={() => { setView('landing'); setFinished(false); window.scrollTo(0,0); }} 
                        className="flex items-center gap-2 text-green-100 hover:text-white transition mb-6 hover:bg-white/10 pr-4 py-2 rounded-lg"
                    >
                        <ArrowLeft size={20}/><span className="font-semibold">Kembali</span>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Formulir Survei</h1>
                        <p className="text-green-100 text-sm mb-6 max-w-2xl">Mohon isi data dengan sebenar-benarnya untuk peningkatan kualitas layanan IAIN Bone.</p>
                        <div className="mt-8 pt-6 border-t border-white/20">
                            <div className="space-y-4 text-sm">
                                <div>
                                <h4 className="font-bold text-white mb-2 text-base">Petunjuk Pengisian :</h4>
                                <ol className="list-decimal list-outside pl-4 space-y-1 text-green-50 font-medium">
                                    <li>Jawaban sesuai keadaan sebenarnya.</li>
                                    <li>Pastikan tidak ada pertanyaan terlewat.</li>
                                    <li>Jawaban Anda <strong>dijaga kerahasiaannya</strong>.</li>
                                </ol>
                                </div>
                                <div>
                                <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wide">Keterangan Penilaian :</h4>
                                <div className="flex flex-wrap gap-3 text-xs">
                                    <span className="bg-white/20 px-2 py-1 rounded text-white font-medium">1: Tidak Baik</span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-white font-medium">2: Kurang Baik</span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-white font-medium">3: Baik</span>
                                    <span className="bg-white/20 px-2 py-1 rounded text-white font-medium">4: Sangat Baik</span>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {finished ? (
            <div className="bg-white p-12 rounded-lg shadow-sm text-center border-t-4 border-green-600 animate-scale-up py-16">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Terima Kasih!</h2>
              <p className="text-slate-500 mb-8 text-sm">Jawaban Anda telah berhasil kami rekam. Partisipasi Anda sangat berarti bagi kemajuan layanan IAIN Bone.</p>
              
              <div className="mb-8">
                 <button 
                    onClick={() => setShowTwibbon(true)}
                    // FIX: Ditambahkan mx-auto untuk center
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all transform duration-300 animate-pulse-slow mx-auto"
                 >
                    <Share2 size={24} /> Bagikan Twibbon
                 </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center border-t pt-8 border-slate-100">
                 <button 
                    onClick={resetForm} 
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md"
                 >
                    <RefreshCcw size={18}/> Isi Survei Lagi
                 </button>
                 <button 
                    onClick={() => { setView('landing'); resetForm(); }} 
                    className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-green-600 text-green-600 font-bold rounded-xl hover:bg-green-50 transition"
                 >
                    <Home size={18}/> Kembali ke Beranda
                 </button>
              </div>
            </div>
          ) : loadingConfig ? (
            <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
               <p className="text-slate-500">Memuat formulir...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data Responden */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                 <div className="mb-6 border-b pb-2"><h2 className="text-lg font-medium text-slate-900">I. Data Responden</h2></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Unit Kerja <span className="text-red-500">*</span></label>
                       <select name="unit_layanan" required className="w-full p-3 bg-white border border-slate-300 rounded focus:border-green-600 outline-none" onChange={handleChange} value={formData.unit_layanan}>
                          <option value="">-- Pilih Unit Kerja --</option>
                          {Object.keys(serviceData).map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Jenis Layanan <span className="text-red-500">*</span></label>
                       <select name="jenis_layanan" required className="w-full p-3 bg-white border border-slate-300 rounded focus:border-green-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" onChange={handleChange} disabled={!formData.unit_layanan} value={formData.jenis_layanan}>
                          <option value="">{formData.unit_layanan ? "-- Pilih Jenis Layanan --" : "-- Pilih Unit Kerja Terlebih Dahulu --"}</option>
                          {availableServices.map((svc) => (<option key={svc} value={svc}>{svc}</option>))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Usia (Tahun) <span className="text-red-500">*</span></label>
                       <input type="number" min="15" max="99" name="usia" required className="w-full p-3 border border-slate-300 rounded focus:border-green-600 outline-none" placeholder="Contoh: 25" value={formData.usia} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-slate-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                       <div className="flex gap-4 pt-2">
                          {['Laki-laki', 'Perempuan'].map(jk => (
                            <label key={jk} className="flex items-center gap-2 cursor-pointer border border-slate-200 px-4 py-2 rounded-md hover:bg-slate-50 transition peer-checked:border-green-500 peer-checked:bg-green-50">
                               <input 
                                  type="radio" 
                                  name="jenis_kelamin" 
                                  required 
                                  value={jk === 'Laki-laki' ? 'L' : 'P'} 
                                  checked={formData.jenis_kelamin === (jk === 'Laki-laki' ? 'L' : 'P')}
                                  className="accent-green-600 w-4 h-4" 
                                  onChange={handleChange}
                                />
                               <span className="text-sm text-slate-700">{jk}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-sm font-medium text-slate-700">Pendidikan Terakhir <span className="text-red-500">*</span></label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                          {['SD/SMP', 'SMA/Sederajat', 'D3', 'S1/D4', 'S2', 'S3'].map(edu => (
                             <label key={edu} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition peer-checked:border-green-500 peer-checked:bg-green-50">
                                <input 
                                  type="radio" 
                                  name="pendidikan" 
                                  required 
                                  value={edu} 
                                  checked={formData.pendidikan === edu}
                                  className="accent-green-600 w-4 h-4" 
                                  onChange={handleChange}
                                />
                                <span className="text-sm text-slate-700">{edu}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-sm font-medium text-slate-700">Pekerjaan <span className="text-red-500">*</span></label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                          {['Tenaga Pendidik', 'Tenaga Kependidikan', 'Mahasiswa', 'Masyarakat Umum', 'Orang Tua'].map(job => (
                             <label key={job} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition peer-checked:border-green-500 peer-checked:bg-green-50">
                                <input 
                                  type="radio" 
                                  name="pekerjaan" 
                                  required 
                                  value={job} 
                                  checked={formData.pekerjaan === job}
                                  className="accent-green-600 w-4 h-4" 
                                  onChange={handleChange}
                                />
                                <span className="text-sm text-slate-700">{job}</span>
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Pertanyaan */}
              <div className="space-y-4">
                 <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-medium text-slate-900">II. Pendapat Responden</h2>
                    <p className="text-sm text-slate-500 mt-1">Berikan penilaian Anda dari skala 1 (Tidak Baik) sampai 4 (Sangat Baik).</p>
                 </div>
                 {config.length === 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                        <div className="flex gap-3"><AlertCircle className="text-yellow-600 w-5 h-5"/><div><p className="text-sm font-bold text-yellow-700">Pertanyaan belum muncul?</p><p className="text-xs text-yellow-600 mt-1">Pastikan proses cache data sudah berjalan.</p></div></div>
                    </div>
                 )}
                 {config.map((item) => (
                    <div key={item.kode} className="bg-white rounded-lg shadow-sm p-6 sm:p-8 border border-slate-200 hover:shadow-md transition-shadow">
                       <h3 className="text-base font-medium text-slate-900 mb-6 leading-relaxed">{item.kode}. {item.pertanyaan} <span className="text-red-500">*</span></h3>
                       <div className="mt-4">
                          <div className="flex justify-between w-full sm:hidden mb-4 px-1">
                             <span className="text-xs font-semibold text-slate-500 text-left w-1/2 pr-2">{item.label_skala_1 || "Tidak Baik"}</span>
                             <span className="text-xs font-semibold text-slate-500 text-right w-1/2 pl-2">{item.label_skala_4 || "Sangat Baik"}</span>
                          </div>
                          <div className="flex flex-row items-center justify-between max-w-3xl mx-auto">
                             <span className="hidden sm:block text-sm font-medium text-slate-500 w-32 text-right">{item.label_skala_1 || "Tidak Baik"}</span>
                             <div className="flex items-center justify-between w-full sm:w-auto sm:gap-12 px-2 sm:px-6">
                                {[1, 2, 3, 4].map((val) => (
                                   <label key={val} className="flex flex-col items-center gap-2 cursor-pointer group">
                                      <span className="text-sm font-medium text-slate-500 group-hover:text-green-600 transition-colors">{val}</span>
                                      <div className="relative flex items-center justify-center">
                                         <input 
                                            type="radio" 
                                            name={item.kode} 
                                            value={val} 
                                            required 
                                            checked={formData[item.kode.toLowerCase()] === val}
                                            className="peer sr-only" 
                                            onChange={(e) => handleScaleChange(item.kode, e.target.value)} 
                                         />
                                         <div className="w-8 h-8 rounded-full border-2 border-slate-300 group-hover:border-green-400 peer-checked:border-green-600 peer-checked:bg-white transition-all"></div>
                                         <div className="absolute w-4 h-4 bg-green-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                      </div>
                                   </label>
                                ))}
                             </div>
                             <span className="hidden sm:block text-sm font-medium text-slate-500 w-32 text-left">{item.label_skala_4 || "Sangat Baik"}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Saran */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
                 <h2 className="text-base font-medium text-slate-900 mb-4">III. Saran & Masukan <span className="text-red-500">*</span></h2>
                 <div className="relative">
                    <textarea 
                        name="saran" 
                        rows="10" 
                        required 
                        className="w-full border-b border-slate-300 focus:border-green-600 focus:border-b-2 outline-none py-2 transition-all resize-none bg-transparent" 
                        placeholder="Tuliskan saran perbaikan..." 
                        onChange={handleChange}
                        value={formData.saran}
                    ></textarea>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 peer-focus:w-full"></div>
                 </div>
              </div>

              <div className="flex justify-between items-center py-4">
                 <button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-2.5 rounded shadow-sm transition-all flex items-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={18}/> : "Kirim Survei"}
                 </button>
                 <button 
                    type="button" 
                    onClick={resetForm} 
                    className="text-green-600 text-sm font-medium hover:text-green-800"
                 >
                    Kosongkan Formulir
                 </button>
              </div>
            </form>
          )}
          
          {/* Simple Footer Replacement Form */}
          <div className="mt-12  pb-16 md:pb-8 flex flex-col items-center justify-center space-y-3">
             <img 
               src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirtCL38l8xSTAvcT1GScchzPGsMvWcLH_aM3i80yhEgbA1r7ah4SqLT-wF8t4XHh_2p-kUuGcmpujoNiCPdGglnuZ1u2Xt_KFdQzsTtCrGHRQ2al0Bthge_VqSyo_xi_83M90TxoBbZW7nLmVqtGkGhZ886MFPqpeTx9TXMkxQ7rBJO_yqYF7jgBvoQeg/s253/logoskm-iain.png" 
               alt="Logo IAIN Bone" 
               className="h-10 w-auto object-contain opacity-80" 
             />
             <p className="text-xs text-slate-500 font-medium text-center">
               &copy; {new Date().getFullYear()} Layanan IAIN Bone ♥️ Biro AUAK IAIN Bone
             </p>
          </div>
        </div>
        
        {/* --- MODAL TWIBBON DIPASANG DISINI --- */}
        <TwibbonModal isOpen={showTwibbon} onClose={() => setShowTwibbon(false)} />
      </div>
    );
  }

  // --- VIEW: LANDING PAGE ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative animate-fade-in">
      {/* ... Landing Page Content (Hero, Reports, etc.) ... */}
      <div className="bg-gradient-to-br from-lime-400 to-green-600 pb-24 pt-8 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-lime-300 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          
          <div className="mb-6 bg-white p-4 rounded-3xl shadow-xl inline-block hover:scale-105 transition-transform duration-300 cursor-pointer">
             <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirtCL38l8xSTAvcT1GScchzPGsMvWcLH_aM3i80yhEgbA1r7ah4SqLT-wF8t4XHh_2p-kUuGcmpujoNiCPdGglnuZ1u2Xt_KFdQzsTtCrGHRQ2al0Bthge_VqSyo_xi_83M90TxoBbZW7nLmVqtGkGhZ886MFPqpeTx9TXMkxQ7rBJO_yqYF7jgBvoQeg/s253/logoskm-iain.png" alt="Logo IAIN Bone" className="h-12 w-auto object-contain" />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-1.5 rounded-full text-white text-sm font-semibold mb-6 border border-white/30 shadow-sm">
            <ShieldCheck size={18} /> Portal Survei layanan IAIN Bone
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-sm">
            Survei Kepuasan Masyarakat IAIN Bone
          </h1>
          
          <p className="text-lime-50 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Transparan, Akuntabel, dan Terpercaya.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-8 max-w-lg w-full text-white shadow-lg flex flex-col items-center gap-6">
             <div className="w-full">
                 <h3 className="text-lime-200 font-bold uppercase text-xs tracking-wider mb-3 flex items-center justify-center gap-2">
                   <Calendar size={14}/> Waktu Pelaksanaan
                 </h3>
                 <div className="text-center space-y-1">
                    <p className="text-2xl font-bold">{info.Periode || "Periode Aktif"}</p>
                    {info.Tanggal_Mulai && info.Tanggal_Selesai && (
                      <p className="text-sm opacity-90 flex items-center justify-center gap-2">
                        {info.Tanggal_Mulai} s.d. {info.Tanggal_Selesai}
                      </p>
                    )}
                 </div>
             </div>

             <button 
                onClick={() => { setView('survey'); window.scrollTo(0,0); }} 
                className="w-full inline-flex items-center justify-center gap-3 bg-white text-green-700 font-bold text-xl px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all transform duration-300 group"
             >
                Mulai Isi Survei <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform"/>
             </button>
          </div>

        </div>
      </div>

<div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-12">
          <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg text-green-600"><Activity size={24} /></div>
            <div><h2 className="text-xl font-bold text-slate-800">Laporan Survei</h2></div>
            </div>
            
            {history.length > itemsPerSlide && (
              <div className="flex gap-2">
                <button onClick={prevSlide} className="p-2 rounded-full bg-white border hover:bg-slate-100 shadow-sm"><ChevronLeft size={20}/></button>
                <button onClick={nextSlide} className="p-2 rounded-full bg-white border hover:bg-slate-100 shadow-sm"><ChevronRight size={20}/></button>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {loadingHistory ? (
              <div className="space-y-4">
                 <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                 <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>
              </div>
            ) : history.length > 0 ? (
              <div className="flex flex-col gap-4">
                {visibleReports.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedReport(item)}
                    className="group bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 hover:border-green-500 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
                  >
                    {/* Left: Info */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-slate-50 text-slate-500 rounded-xl items-center justify-center font-bold text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                        {currentSlide * itemsPerSlide + idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-1 group-hover:text-green-700 transition-colors leading-snug break-words">
                          {item.periode}
                        </h3>
                        <p className="hidden sm:block text-sm text-slate-500 line-clamp-1">{item.ringkasan}</p>
                        
                        {/* Mobile Modern Stats (Like Image 1/WhatsApp Image) */}
                        <div className="flex sm:hidden items-center gap-6 mt-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">IKM</span>
                                <span className="text-2xl font-extrabold text-slate-800 leading-none">{item.nilai_ikm}</span>
                            </div>
                            
                            <div className="w-px h-8 bg-slate-200"></div>

                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">MUTU</span>
                                <span className={`inline-block px-3 py-0.5 rounded-md text-sm font-bold bg-blue-100 text-blue-700`}>
                                     {item.mutu}
                                </span>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats Desktop */}
                    <div className="hidden sm:flex items-center gap-12 w-full sm:w-auto justify-end">
                      <div className="text-center">
                        <span className="text-2xl font-extrabold text-slate-800">{item.nilai_ikm}</span>
                      </div>
                      <div className="text-center">
                        <span className={`inline-block px-4 py-1 rounded-lg text-sm font-bold border ${getMutuColor(item.mutu)}`}>
                          {item.mutu}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                         <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300"><BarChart3 className="mx-auto h-12 w-12 text-slate-300 mb-3" /><h3 className="text-lg font-bold text-slate-600">Belum Ada Riwayat Data</h3><p className="text-slate-500">Data hasil survei periode sebelumnya akan ditampilkan di sini.</p></div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-lime-300 transition group">
            <div className="w-14 h-14 bg-lime-100 text-lime-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><BarChart3 size={28} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Transparansi Data</h3>
            <p className="text-slate-500 leading-relaxed">Hasil survei diolah secara profesional dan ditampilkan kepada publik sebagai bentuk pertanggungjawaban kinerja pelayanan IAIN Bone.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-green-300 transition group">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Award size={28} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Dasar Hukum</h3>
            <p className="text-slate-500 leading-relaxed">Survei ini mengacu pada <a href="https://jdih.menpan.go.id/dokumen-hukum/PERATURAN%20MENTERI/jenis/678?PERATURAN%20MENTERI" target="_blank" rel="noreferrer" className="text-green-600 font-semibold hover:underline">Permenpan RB No. 14 Tahun 2017</a> untuk menjamin validitas pengukuran Indeks Kepuasan Masyarakat (IKM).</p>
          </div>
        </div>
      </div>

      <FooterIAIN />

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div><h3 className="text-xl font-bold text-slate-800">Detail Laporan SKM</h3><p className="text-sm text-green-600 font-medium">{selectedReport.periode}</p></div>
               <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24} className="text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 relative">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center"><p className="text-xs text-blue-500 uppercase font-bold">Nilai IKM</p><p className="text-2xl font-bold text-blue-700">{selectedReport.nilai_ikm}</p></div>
                  <div className={`p-4 rounded-xl border text-center ${getMutuColor(selectedReport.mutu).split("group-hover")[0]}`}><p className="text-xs uppercase font-bold opacity-70">Mutu Pelayanan</p><p className="text-2xl font-bold">{selectedReport.mutu}</p></div>
                  <div className="col-span-2 bg-white p-4 rounded-xl border border-slate-200"><p className="text-xs text-slate-400 uppercase font-bold mb-1">Ringkasan</p><p className="text-sm text-slate-700">{selectedReport.ringkasan}</p></div>
               </div>
                {/* POIN 1: Tombol Tutup & Unduh dipindahkan ke atas Pratinjau Dokumen KHUSUS MOBILE (md:hidden) */}
               <div className="flex md:hidden justify-end gap-3 mb-4">
                 <button onClick={() => setSelectedReport(null)} className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition text-sm">Tutup</button>
                 {parseDriveLink(selectedReport.link_download).download && (
                   <a href={parseDriveLink(selectedReport.link_download).download} target="_blank" rel="noreferrer" className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm shadow-green-200 text-sm"><Download size={16} /> Unduh</a>
                 )}
               </div>
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-6">
                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-sm font-medium text-slate-600"><FileText size={16} /> Pratinjau Dokumen</div>
                  <div className="aspect-video w-full bg-slate-200 relative">
                     {parseDriveLink(selectedReport.link_download).preview ? (
                        <iframe src={parseDriveLink(selectedReport.link_download).preview} className="w-full h-full absolute inset-0" allow="autoplay" title="Preview Dokumen"></iframe>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400"><Eye size={48} className="mb-2 opacity-50" /><p>Pratinjau tidak tersedia (Link tidak valid)</p></div>
                     )}
                  </div>
               </div>
            </div>
            {/* Footer Modal asli disembunyikan di mobile (hidden md:flex) */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white hidden md:flex justify-end gap-3">
               <button onClick={() => setSelectedReport(null)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition">Tutup</button>
               {parseDriveLink(selectedReport.link_download).download && (
                 <a href={parseDriveLink(selectedReport.link_download).download} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-200"><Download size={18} /> Unduh Laporan</a>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}