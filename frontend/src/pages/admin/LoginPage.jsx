import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, saveSession } from '../../services/auth';
import { Lock, User, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await loginAdmin(username, password);

    if (res.status === 'success') {
      saveSession(res.data);
      navigate('/admin'); // Arahkan ke root admin
    } else {
      setErrorMsg(res.message || 'Login gagal. Periksa username/password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-600 p-8 text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                <ShieldCheck className="text-green-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
            <p className="text-green-100 text-sm">SIM Survei Kepuasan Masyarakat</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                <input type="text" required className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" placeholder="Masukkan username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input type="password" required className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Masuk Dashboard"}
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} IAIN Bone. Unauthorized access prohibited.</div>
        </div>
      </div>
    </div>
  );
}