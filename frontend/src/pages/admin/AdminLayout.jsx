import React, { useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import DataResponden from './DataResponden'; 
import UserManagement from './UserManagement'; 
import SettingsPage from './SettingsPage'; 
import LaporanPage from './LaporanPage'; // IMPORT HALAMAN BARU

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('DataResponden');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 

  const renderContent = () => {
    switch(activeTab) {
      case 'data': return <DataResponden />;
      case 'laporan': return <LaporanPage />; // CASE BARU
      case 'users': return <UserManagement />;
      case 'settings': return <SettingsPage />;
      default: return <DataResponden />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto animate-fade-in">
             {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}