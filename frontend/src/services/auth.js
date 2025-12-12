// GANTI DENGAN URL WEB APP GAS ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbyRljR2vjozXtvEkbnemM39IBEIEN5VY_7jpnZas3amAS35U_tH4NKc89-yCf8RE5bYhQ/exec";

export const loginAdmin = async (username, password) => {
  try {
    const params = new URLSearchParams({
      action: 'login',
      u: username,
      p: password
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Login Error:", error);
    return { status: 'error', message: 'Gagal terhubung ke server.' };
  }
};

export const saveSession = (userData) => {
  localStorage.setItem('admin_token', userData.token);
  localStorage.setItem('admin_user', JSON.stringify(userData));
};

export const getSession = () => {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');
  return { token, user: userStr ? JSON.parse(userStr) : null };
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = '/survei/admin/login'; 
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('admin_token');
};