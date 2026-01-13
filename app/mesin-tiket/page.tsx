'use client';

import { useState, useEffect } from 'react';

type MyQueue = {
  id: number;
  number: number;
  clinic: string;
  status: string;
  date: string;
};

const CLINICS = ['Umum', 'Gigi', 'Anak', 'Mata', 'THT', 'Jantung'];

export default function MesinTiket() {
  const [myQueue, setMyQueue] = useState<MyQueue | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success'|'error'|'info'}>({
    show: false, message: '', type: 'success'
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showToast = (message: string, type: 'success'|'error'|'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        showToast('Tidak dapat masuk mode fullscreen', 'error');
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const handleAmbilNomor = async (clinic: string) => {
    setLoading(clinic);
    try {
      const res = await fetch('/api/queue/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic })
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }

      setMyQueue(data);
      showToast('Nomor antrian berhasil diambil', 'success');
    } catch (error) {
      showToast('Gagal mengambil nomor. Silakan coba lagi.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const cetakNomor = () => {
    if (!myQueue) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ticketHTML = `
      <html>
        <head>
          <title>Tiket Antrian ${myQueue.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              text-align: center; 
              padding: 40px 20px;
              background: white;
              color: #000;
            }
            .container { max-width: 400px; margin: 0 auto; }
            .header { 
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 40px;
            }
            .header h1 { 
              font-size: 28px; 
              font-weight: bold; 
              letter-spacing: 2px;
              margin-bottom: 5px;
            }
            .header h2 { 
              font-size: 14px; 
              font-weight: normal;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .number-section {
              margin: 50px 0;
            }
            .number { 
              font-size: 120px; 
              font-weight: bold; 
              line-height: 1;
              margin: 30px 0;
            }
            .clinic { 
              font-size: 28px; 
              font-weight: 600; 
              margin: 20px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .date { 
              font-size: 14px; 
              color: #666;
              margin: 10px 0;
            }
            .footer { 
              margin-top: 60px; 
              border-top: 2px dashed #ccc; 
              padding-top: 30px;
            }
            .footer p {
              font-size: 12px;
              color: #666;
              margin: 5px 0;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RUMAH SAKIT</h1>
              <h2>Tiket Antrian</h2>
            </div>
            <div class="number-section">
              <div class="number">${myQueue.number}</div>
              <div class="clinic">Poli ${myQueue.clinic}</div>
              <div class="date">${new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>
            <div class="footer">
              <p>Harap simpan tiket ini dengan baik</p>
              <p>Terima kasih atas kunjungan Anda</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 100);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  const reset = () => {
    setMyQueue(null);
  };

  return (
    <div className="h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-50 p-2 bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 shadow-xl animate-slide-down ${
          toast.type === 'success' ? 'bg-black text-white' :
          toast.type === 'error' ? 'bg-gray-900 text-white' : 'bg-gray-800 text-white'
        } font-medium text-center border border-gray-700 text-sm`}>
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-6xl h-full flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-2xl w-full">
          {/* Header */}
          <div className="bg-black text-white px-6 py-4 text-center">
            <h1 className="text-3xl font-bold tracking-wider">ANTRIAN</h1>
            <p className="text-xs tracking-widest uppercase mt-1">Sistem Tiket</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {myQueue ? (
              <div className="space-y-4">
                {/* Ticket Display */}
                <div className="text-center border-4 border-black p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-3">
                    Nomor Antrian Anda
                  </p>
                  <div className="text-8xl font-bold text-black mb-4 leading-none">
                    {myQueue.number}
                  </div>
                  <div className="text-2xl font-bold text-black mb-2 uppercase tracking-wide">
                    Poli {myQueue.clinic}
                  </div>
                  <div className="text-xs text-gray-600 tracking-wide">
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={cetakNomor}
                    className="px-6 py-4 bg-black text-white font-bold text-sm uppercase tracking-wide transition-all duration-200 hover:bg-gray-800 border-2 border-black"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Cetak
                    </span>
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-4 bg-white text-black font-bold text-sm uppercase tracking-wide transition-all duration-200 hover:bg-gray-100 border-2 border-black"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Title */}
                <div className="text-center mb-3">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-black">
                    Pilih Poli Tujuan
                  </h2>
                </div>

                {/* Poli Buttons Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {CLINICS.map((clinic) => (
                    <button
                      key={clinic}
                      onClick={() => handleAmbilNomor(clinic)}
                      disabled={loading !== null}
                      className="relative px-4 py-8 bg-white text-black font-bold text-lg uppercase tracking-wide transition-all duration-200 hover:bg-black hover:text-white border-4 border-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === clinic ? (
                        <span className="flex flex-col items-center justify-center gap-2">
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-xs">Memproses...</span>
                        </span>
                      ) : (
                        <span className="flex flex-col items-center justify-center gap-2">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <span>{clinic}</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Instruction */}
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <p className="text-center text-xs text-gray-600 uppercase tracking-wide">
                    Klik pada poli yang ingin Anda tuju
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}