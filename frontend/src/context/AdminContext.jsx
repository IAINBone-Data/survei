import React, { createContext, useContext, useState, useCallback } from 'react';

// --- KONFIGURASI API ---
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec"; // GANTI URL ANDA

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

const getToken = () => localStorage.getItem('admin_token');

export const AdminProvider = ({ children }) => {
  const [stats, setStats] = useState(null);       
  const [respondents, setRespondents] = useState(null); 
  const [users, setUsers] = useState(null);       
  const [info, setInfo] = useState(null);         

  const [loading, setLoading] = useState({
    stats: false, respondents: false, users: false, info: false
  });

  const fetchStats = useCallback(async (force = false) => {
    if (stats && !force) return;
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}?action=getAdminStats&token=${token}`);
      const json = await res.json();
      if (json.status === 'success') setStats(json.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(prev => ({ ...prev, stats: false })); }
  }, [stats]);

  const fetchRespondents = useCallback(async (force = false) => {
    if (respondents && !force) return;
    setLoading(prev => ({ ...prev, respondents: true }));
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}?action=getAdminData&token=${token}`);
      const json = await res.json();
      if (json.status === 'success') setRespondents(json.data); 
    } catch (err) { console.error(err); } 
    finally { setLoading(prev => ({ ...prev, respondents: false })); }
  }, [respondents]);

  const fetchUsers = useCallback(async (force = false) => {
    if (users && !force) return;
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}?action=getUsers&token=${token}`);
      const json = await res.json();
      if (json.status === 'success') setUsers(json.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(prev => ({ ...prev, users: false })); }
  }, [users]);

  const fetchInfo = useCallback(async (force = false) => {
    if (info && !force) return;
    setLoading(prev => ({ ...prev, info: true }));
    try {
      const res = await fetch(`${API_URL}?action=getInfo`); 
      const json = await res.json();
      if (json.status === 'success') setInfo(json.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(prev => ({ ...prev, info: false })); }
  }, [info]);

  const prefetchAll = useCallback(() => {
    console.log("🚀 Memulai Background Prefetching...");
    setTimeout(() => { fetchStats(); }, 100);
    setTimeout(() => { fetchRespondents(); }, 1500); 
    setTimeout(() => { fetchUsers(); }, 3000);
    setTimeout(() => { fetchInfo(); }, 4000);
  }, [fetchStats, fetchRespondents, fetchUsers, fetchInfo]);

  const removeRespondentLocal = (id) => {
    if (!respondents) return;
    setRespondents(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id)
    }));
  };

  const removeUserLocal = (rowIndex) => {
     if (!users) return;
     setUsers(prev => prev.filter(u => u.rowIndex !== rowIndex));
  };

  return (
    <AdminContext.Provider value={{
      stats, respondents, users, info, loading,
      fetchStats, fetchRespondents, fetchUsers, fetchInfo,
      prefetchAll,
      removeRespondentLocal, removeUserLocal
    }}>
      {children}
    </AdminContext.Provider>
  );
};