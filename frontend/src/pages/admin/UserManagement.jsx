import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, ShieldAlert, Loader2, X } from 'lucide-react';
// Import Context
import { useAdmin } from '../../context/AdminContext';

// URL API hanya untuk aksi Write (Tambah/Hapus)
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec"; 

export default function UserManagement() {
  // GUNAKAN DATA DARI CONTEXT
  const { users, loading, fetchUsers, removeUserLocal } = useAdmin();
  
  const [showModal, setShowModal] = useState(false);
  const [services, setServices] = useState({}); // Layanan masih fetch manual karena jarang berubah
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'AdminUnit', unit: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const sessionInfo = JSON.parse(localStorage.getItem('admin_user'));

  // Load Users via Context
  useEffect(() => {
    if (sessionInfo?.role === 'SuperAdmin') {
       fetchUsers();
    }
    // Load Services untuk dropdown (sekali saja)
    fetch(`${API_URL}?action=getServices`)
      .then(res => res.json())
      .then(json => {
         if(json.status === 'success') setServices(json.data);
      });
  }, [fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('admin_token');

    try {
      await fetch(`${API_URL}?action=addUser&token=${token}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      alert("Permintaan tambah user dikirim. Data akan muncul sesaat lagi.");
      setShowModal(false);
      setFormData({ username: '', password: '', role: 'AdminUnit', unit: '' });
      
      // Refresh cache setelah nambah
      setTimeout(() => { fetchUsers(true); }, 2000);

    } catch (error) {
      alert("Gagal menambah user: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rowIndex, username) => {
    if(!confirm(`Yakin ingin menghapus user "${username}"?`)) return;
    
    // Optimistic Delete (UI update immediately)
    removeUserLocal(rowIndex);

    // Server Request
    const token = localStorage.getItem('admin_token');
    await fetch(`${API_URL}?action=deleteUser&token=${token}&id=${rowIndex}`);
  };

  if (sessionInfo?.role !== 'SuperAdmin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
         <ShieldAlert size={48} className="mb-2 text-red-400"/>
         <h3 className="font-bold text-slate-600">Akses Ditolak</h3>
         <p className="text-sm">Hanya Super Admin yang dapat mengelola pengguna.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h2>
           <p className="text-slate-500 text-sm">Kelola akun admin dan hak akses unit kerja.</p>
        </div>
        <button 
           onClick={() => setShowModal(true)}
           className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200"
        >
           <UserPlus size={18} /> Tambah User Baru
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading.users && !users ? (
           <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-green-600"/></div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">Username</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4">Unit Kerja</th>
                   <th className="px-6 py-4">Terakhir Login</th>
                   <th className="px-6 py-4 text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users && users.map((u) => (
                   <tr key={u.rowIndex} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-bold text-slate-800">{u.username}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="px-6 py-4">{u.unit || '-'}</td>
                     <td className="px-6 py-4 text-xs text-slate-400">
                       {u.last_login ? new Date(u.last_login).toLocaleString() : 'Belum pernah'}
                     </td>
                     <td className="px-6 py-4 text-right">
                       {u.username !== sessionInfo.username && (
                         <button 
                           onClick={() => handleDelete(u.rowIndex, u.username)}
                           className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                           title="Hapus User"
                         >
                            <Trash2 size={16} />
                         </button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

      {/* MODAL TAMBAH USER */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">Tambah User Baru</h3>
                 <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
              </div>
              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Username</label>
                    <input type="text" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Password</label>
                    <input type="password" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Role</label>
                    <select className="w-full p-2 border rounded-lg outline-none"
                      value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="AdminUnit">Admin Unit</option>
                        <option value="SuperAdmin">Super Admin</option>
                    </select>
                 </div>
                 
                 {formData.role === 'AdminUnit' && (
                   <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1">Unit Kerja</label>
                      <select required className="w-full p-2 border rounded-lg outline-none"
                        value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                          <option value="">-- Pilih Unit --</option>
                          {Object.keys(services).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                 )}

                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">Batal</button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                       {submitting && <Loader2 size={16} className="animate-spin"/>} Simpan
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}