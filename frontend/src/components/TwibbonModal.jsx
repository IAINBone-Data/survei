import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, Image as ImageIcon, Loader2, Move, ZoomIn } from 'lucide-react';

export default function TwibbonModal({ isOpen, onClose }) {
  const [image, setImage] = useState(null);
  const [frameImage, setFrameImage] = useState(null); 
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // State untuk Manipulasi Gambar
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // KONFIGURASI ASET
  const FRAME_URL = "assets/twibbon_frame.png";
  const PREVIEW_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgIqa6BE2p-OfI1sAxcEkI9pOpwXV4qnsb2X_Ur2ujCoq9lkglPFNIMfhb8WySWAyIuHFZloG8hQwQQvFR-dkUoVh-4cZaKMyxrZ3T2FgRXqVs61Nw-CIFoPmJBfmEFKDMvrGMW37AxWtMVpftOeuuh2XyLW4WOFIVC140D_yyPAX7tu_QR4WoPthCy6k/s1080/Desain%20SKM%20IAIN%20Bone-twibbon.png";

  // 1. Load Frame saat Modal Dibuka
  useEffect(() => {
    if (isOpen) {
        const frame = new Image();
        frame.crossOrigin = "anonymous";
        frame.src = FRAME_URL;
        frame.onload = () => setFrameImage(frame);
        frame.onerror = () => setErrorMsg("Gagal memuat frame. Pastikan file assets/twibbon_frame.png ada.");
    }
  }, [isOpen]);

  // 2. Fungsi Menggambar Canvas
  const drawCanvas = () => {
    if (!image || !frameImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = frameImage.width;
    canvas.height = frameImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseScale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const currentScale = baseScale * scale;

    const centerX = (canvas.width - image.width * currentScale) / 2;
    const centerY = (canvas.height - image.height * currentScale) / 2;

    const x = centerX + position.x;
    const y = centerY + position.y;

    // Layer 1: Foto User
    ctx.drawImage(image, x, y, image.width * currentScale, image.height * currentScale);
    // Layer 2: Frame
    ctx.drawImage(frameImage, 0, 0);
  };

  useEffect(() => {
    drawCanvas();
  }, [image, frameImage, scale, position]);


  // 3. Handle Upload
  const handleImageUpload = (e) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg("Mohon upload file gambar.");
        return;
      }
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            setImage(img);
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setLoading(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Handle Dragging
  const onMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const multiplier = (canvasRef.current.width / canvasRef.current.clientWidth) || 1;
      setPosition(prev => ({ x: prev.x + dx * multiplier, y: prev.y + dy * multiplier }));
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => setIsDragging(false);

  const onTouchStart = (e) => {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const onTouchMove = (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      
      const multiplier = (canvasRef.current.width / canvasRef.current.clientWidth) || 1;
      setPosition(prev => ({ x: prev.x + dx * multiplier, y: prev.y + dy * multiplier }));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  
  const onTouchEnd = () => setIsDragging(false);


  // 5. Final Action (Download Only)
  const generateFinalImage = () => {
      return canvasRef.current.toDataURL('image/png');
  };

  const handleDownload = () => {
      const finalData = generateFinalImage();
      if (!finalData) return;

      const link = document.createElement('a');
      link.href = finalData;
      link.download = 'twibbon-skm-iain-bone.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleClose = () => {
      setImage(null);
      setPosition({x:0, y:0});
      setScale(1);
      setErrorMsg(null);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Bagikan Partisipasi Anda</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto text-center flex flex-col items-center justify-start min-h-[300px]">
          {!image ? (
            <div className="w-full flex flex-col items-center justify-center h-full space-y-6 py-10">
              <div className="w-48 h-48 bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                 <img src={PREVIEW_URL} alt="Preview Twibbon" className="w-full h-full object-contain bg-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-800">Upload Foto Terbaikmu</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Buat kartu tanda partisipasi dan bagikan ke media sosial.
                </p>
              </div>
              <div className="pt-2 w-full">
                  <label className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-green-200 cursor-pointer hover:bg-green-700 hover:-translate-y-1 transition-all w-full sm:w-auto">
                    <Upload size={20} /> Pilih Foto
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full">
               <div 
                  className="relative w-full max-w-[320px] mx-auto bg-slate-200 rounded-lg overflow-hidden border shadow-sm cursor-move touch-none"
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
               >
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                      <Loader2 className="animate-spin text-green-600 mb-2" size={32} />
                      <p className="text-xs text-green-600 font-medium">Memproses...</p>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="w-full h-auto block" />
                  
                  {!isDragging && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none flex items-center gap-1">
                        <Move size={10} /> Geser untuk mengatur posisi
                    </div>
                  )}
               </div>

               <div className="flex items-center gap-3 px-4 w-full max-w-[320px] mx-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                   <ZoomIn size={16} className="text-slate-400" />
                   <input 
                      type="range" 
                      min="0.5" 
                      max="3" 
                      step="0.1" 
                      value={scale} 
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                   />
               </div>
            </div>
          )}
          {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 w-full">
                  {errorMsg}
              </div>
          )}
        </div>

        {image && !loading && (
          <div className="p-4 border-t bg-white grid grid-cols-2 gap-3">
             <button onClick={() => { setImage(null); setScale(1); setPosition({x:0,y:0}); }} className="py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition">Ganti Foto</button>
             
             {/* TOMBOL UNDUH (TANPA LOGIKA SHARE LAGI) */}
             <button 
                onClick={handleDownload} 
                className="py-3 px-4 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
             >
                <Download size={18}/> Unduh Hasil
             </button>
          </div>
        )}
      </div>
    </div>
  );
}