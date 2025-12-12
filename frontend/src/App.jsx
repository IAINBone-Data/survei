import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/admin/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
// Import Provider Baru
import { AdminProvider } from './context/AdminContext';

// Placeholder Logout jika belum ada komponen lain yang handle
const LogoutHandler = () => {
    localStorage.clear();
    window.location.href = '/survei/admin/login';
    return null;
};

function App() {
  return (
    <BrowserRouter basename="/survei">
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Rute Admin (Terproteksi & Dibungkus AdminProvider) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={
            <AdminProvider>
               <AdminLayout />
            </AdminProvider>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;