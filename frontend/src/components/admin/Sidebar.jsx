import React, { useEffect, useState } from 'react';
import { FileText, Settings, LogOut, Users, PieChart, ShieldCheck, ChevronRight, ChevronLeft, UserCircle, Lock } from 'lucide-react';
import ModernModal from '../ui/ModernModal';

// --- (Fungsi logoutAdmin & getSessionUser sama seperti sebelumnya) ---
const logoutAdmin = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = '/survei/admin/login'; 
};

const getSessionUser = () => {
  const userStr = localStorage.getItem('admin_user');
  return userStr ? JSON.parse(userStr) : null;
};

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, toggleSidebar }) {
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  const menuItems = [
    { id: 'data', icon: FileText, label: 'Data Responden' },
    { id: 'laporan', icon: PieChart, label: 'Laporan & Statistik' }, // MENU BARU
    { id: 'users', icon: Users, label: 'Manajemen User' },
    { id: 'settings', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <>
      <aside 
        className={`fixed left-0 top-0 bottom-0 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out 
          bg-gradient-to-b from-green-800 to-green-950 text-white
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-center border-b border-green-700/50 relative">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'px-0' : 'px-6 w-full'}`}>
              <div className="w-10 h-10 bg-white text-green-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                 <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                 <h1 className="font-bold text-lg leading-none whitespace-nowrap">Admin Panel</h1>
                 <p className="text-[10px] text-green-200/80 whitespace-nowrap">SIM Survei IAIN Bone</p>
              </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${activeTab === item.id
                  ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white shadow-lg shadow-green-900/40' 
                  : 'text-green-100/70 hover:bg-white/10 hover:text-white'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon size={22} className={`transition-transform duration-300 ${activeTab === item.id && !isCollapsed ? 'scale-110' : ''}`} />
              <span className={`font-medium text-sm whitespace-nowrap transition-all duration-300 origin-left 
                  ${isCollapsed ? 'w-0 opacity-0 scale-0 hidden' : 'w-auto opacity-100 scale-100'}
              `}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Toggle & Footer (Sama seperti sebelumnya) */}
        <button onClick={toggleSidebar} className="absolute -right-3 top-24 bg-white text-green-800 p-1 rounded-full shadow-md border border-green-100 hover:bg-lime-50 transition-colors z-50 hidden md:flex">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-4 border-t border-green-700/50 bg-green-900/30 space-y-2">
           <div className={`flex items-center gap-3 mb-2 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
             <div className="w-8 h-8 rounded-full bg-green-700/50 flex items-center justify-center text-green-100 border border-green-600/50 flex-shrink-0"><UserCircle size={18} /></div>
             <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <p className="text-sm font-bold text-white leading-tight truncate w-32">{user?.username || 'Admin'}</p>
                <p className="text-[10px] text-green-300 uppercase tracking-wider truncate w-32">{user?.role || 'Super Admin'}</p>
             </div>
           </div>
           <button onClick={() => setShowPasswordModal(true)} title="Ganti Password" className={`flex items-center gap-3 px-3 py-2 w-full text-green-200 hover:text-white hover:bg-green-700/30 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
             <Lock size={18} /><span className={`font-medium text-xs whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Ganti Password</span>
           </button>
           <button onClick={logoutAdmin} title="Keluar" className={`flex items-center gap-3 px-3 py-2 w-full text-red-200 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
             <LogOut size={18} /><span className={`font-medium text-xs whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Keluar</span>
           </button>
        </div>
      </aside>
      
      {/* Modal Password (Sama seperti sebelumnya) */}
      <ModernModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Ganti Password" type="info" confirmText="Simpan Password" onConfirm={() => { alert("Fitur Ganti Password akan diaktifkan segera."); setShowPasswordModal(false); }}>
        <div className="space-y-4"><p>Masukkan password baru Anda untuk mengamankan akun.</p><input type="password" placeholder="Password Baru" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" /><input type="password" placeholder="Konfirmasi Password Baru" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" /></div>
      </ModernModal>
    </>
  );
}