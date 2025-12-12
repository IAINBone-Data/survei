import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ModernModal({ isOpen, onClose, title, children, type = 'info', onConfirm, confirmText = 'Ya, Lanjutkan', loading = false }) {
  if (!isOpen) return null;

  // Konfigurasi warna & icon berdasarkan tipe
  const styles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      bgIcon: 'bg-red-100',
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white',
      borderTop: 'border-t-4 border-red-500'
    },
    success: {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bgIcon: 'bg-green-100',
      btnConfirm: 'bg-green-600 hover:bg-green-700 text-white',
      borderTop: 'border-t-4 border-green-500'
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      bgIcon: 'bg-blue-100',
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white',
      borderTop: 'border-t-4 border-blue-500'
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up ${currentStyle.borderTop}`}>
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentStyle.bgIcon}`}>
              {currentStyle.icon}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          </div>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-slate-600 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition"
          >
            Batal
          </button>
          
          {onConfirm && (
            <button 
              onClick={onConfirm} 
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-bold shadow-md transition flex items-center gap-2 ${currentStyle.btnConfirm} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Memproses...' : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}