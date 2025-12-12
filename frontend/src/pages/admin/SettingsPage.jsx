import React, { useState, useEffect } from 'react';
import { Save, Calendar, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec";

export default function SettingsPage() {
  const { info, fetchInfo } = useAdmin();
  const [formData, setFormData] = useState({ Periode: '', Tanggal_Mulai: '', Tanggal_Selesai: '', Status: 'Buka' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('admin_user'));

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    if (info) setFormData(info);
  }, [info]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('admin_token');
    
    try {
      await fetch(`${API_URL}?action=updateInfo&token=${token}`, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan! Perubahan akan tampil di publik setelah update cache berikutnya.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'SuperAdmin') return <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50"><AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" /><h3 className="text-lg font-bold text-slate-600">Akses Dibatasi</h3><p className="text-slate-500">Hanya Super Admin yang dapat mengubah pengaturan sistem.</p></div>;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div><h2 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h2><p className="text-slate-500 text-sm">Atur jadwal pelaksanaan dan status survei.</p></div>
      {message && (<div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}<div><p className="font-bold">{message.type === 'success' ? 'Berhasil' : 'Gagal'}</p><p className="text-sm">{message.text}</p></div></div>)}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2"><Calendar className="w-5 h-5 text-green-600" /><h3 className="font-bold text-slate-700">Periode & Jadwal</h3></div>
        <form onSubmit={handleSave} className="p-6 space-y-6">
           <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Nama Periode</label><input type="text" name="Periode" value={formData.Periode} onChange={handleChange} required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: Semester Genap 2025" /></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Tanggal Mulai</label><input type="text" name="Tanggal_Mulai" value={formData.Tanggal_Mulai} onChange={handleChange} required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: 01 Januari 2025" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Tanggal Selesai</label><input type="text" name="Tanggal_Selesai" value={formData.Tanggal_Selesai} onChange={handleChange} required className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: 30 Juni 2025" /></div>
           </div>
           <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Status Survei</label><select name="Status" value={formData.Status} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"><option value="Buka">Buka (Aktif)</option><option value="Tutup">Tutup (Nonaktif)</option></select><p className="text-xs text-slate-400">Jika "Tutup", formulir tidak akan menerima respon baru.</p></div>
           <div className="pt-4 border-t border-slate-100 flex justify-end"><button type="submit" disabled={saving} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-70">{saving ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5" />} Simpan Perubahan</button></div>
        </form>
      </div>
    </div>
  );
}