import React, { useEffect } from 'react';
import { Users, Star, TrendingUp, FileText, PieChart as PieIcon, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// Import Context
import { useAdmin } from '../../context/AdminContext';

const COLORS = ['#16a34a', '#ca8a04', '#2563eb', '#dc2626', '#9333ea']; 

export default function DashboardOverview() {
  // GUNAKAN DATA DARI CONTEXT (CACHE)
  const { stats, loading, fetchStats } = useAdmin();

  // Load data saat mount (jika belum ada di cache, dia akan fetch)
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Cek loading spesifik untuk stats
  if (loading.stats && !stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-3 text-green-600" />
      <p>Sedang menghitung statistik...</p>
    </div>
  );

  // Jika error atau data kosong (setelah loading selesai)
  if (!stats) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center gap-3">
      <AlertCircle className="w-6 h-6" />
      <div>
        <h4 className="font-bold">Data Tidak Tersedia</h4>
        <p className="text-sm">Gagal memuat data statistik. Silakan refresh.</p>
      </div>
    </div>
  );

  const { summary, charts } = stats;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Ringkasan Eksekutif</h2>
        <p className="text-slate-500 text-sm">Data real-time dari seluruh responden yang masuk.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-green-600 transition-colors">
                {summary.total}
              </h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai IKM</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-green-600 transition-colors">
                {parseFloat(summary.ikm).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-lime-50 text-lime-600 rounded-xl group-hover:bg-lime-500 group-hover:text-white transition-colors">
              <Star size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 font-medium">
             Mutu: <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded ml-1">{summary.mutu}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laporan Arsip</p>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-2 group-hover:text-green-600 transition-colors">
                   {summary.laporan}
                </h3>
             </div>
             <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <FileText size={24} />
             </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
           <p className="text-xs font-bold text-green-100 uppercase tracking-wider mb-1">Status Sistem</p>
           <h3 className="text-2xl font-bold flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
             </span>
             Online
           </h3>
           <p className="text-xs text-green-50 mt-4 opacity-80">Data sinkron real-time</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <BarChart3 size={20} className="text-green-600"/> Tren Partisipasi
              </h3>
           </div>
           <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.trend}>
                  <defs>
                    <linearGradient id="colorJml" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="jumlah" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorJml)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <PieIcon size={20} className="text-lime-600"/> Demografi Pekerjaan
              </h3>
           </div>
           <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.demography}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.demography.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>
    </div>
  );
}