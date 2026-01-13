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

export default function AmbilNomor() {
  const [myQueue, setMyQueue] = useState<MyQueue | null>(null);
  const [clinic, setClinic] = useState('Umum');
  const [loading, setLoading] = useState(false);
  const [currentCalled, setCurrentCalled] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success'|'error'|'info'}>({
    show: false, message: '', type: 'success'
  });

  useEffect(() => {
    const saved = localStorage.getItem('myQueue');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) {
        setMyQueue(parsed);
        setClinic(parsed.clinic);
      } else {
        localStorage.removeItem('myQueue');
      }
    }
  }, []);

  useEffect(() => {
    if (!myQueue) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/queue/check?id=${myQueue.id}`);
        const data = await res.json();
        
        if (data.queue) {
          setMyQueue(data.queue);
          localStorage.setItem('myQueue', JSON.stringify(data.queue));
        }

        if (data.currentCalled) {
          setCurrentCalled(data.currentCalled);
        }

        if (data.waitingBefore !== undefined) {
          setEstimatedWait(data.waitingBefore * 5);
        }

        if (data.queue?.status === 'CALLED' && !showNotif) {
          setShowNotif(true);
          showToast('Nomor Anda dipanggil! Silakan menuju loket.', 'success');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nomor Anda Dipanggil!', {
              body: `Nomor ${myQueue.number} - ${myQueue.clinic}`,
              icon: '/icon.png'
            });
          }
        }

        if (data.waitingBefore === 2 && myQueue.status === 'WAITING') {
          showToast('Nomor Anda akan segera dipanggil!', 'info');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [myQueue, showNotif]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showToast = (message: string, type: 'success'|'error'|'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleAmbilNomor = async () => {
    if (myQueue && myQueue.status === 'WAITING') {
      showToast('Anda sudah memiliki nomor antrian aktif', 'error');
      return;
    }

    setLoading(true);
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
      localStorage.setItem('myQueue', JSON.stringify(data));
      setShowNotif(false);
      showToast('Nomor antrian berhasil diambil!', 'success');
    } catch (error) {
      showToast('Gagal mengambil nomor. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatal = async () => {
    if (!myQueue) return;
    
    if (!confirm('Yakin ingin membatalkan antrian?')) return;

    try {
      const res = await fetch('/api/queue/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: myQueue.id })
      });

      if (res.ok) {
        handleResetQueue();
        showToast('Antrian berhasil dibatalkan', 'info');
      }
    } catch (error) {
      showToast('Gagal membatalkan antrian', 'error');
    }
  };

  const handleResetQueue = () => {
    setMyQueue(null);
    setCurrentCalled(null);
    setEstimatedWait(0);
    setShowNotif(false);
    localStorage.removeItem('myQueue');
    setClinic('Umum');
  };

  const downloadTicket = () => {
    if (!myQueue) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 550);

    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#6366F1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RUMAH SAKIT', 200, 45);
    ctx.font = '16px Arial';
    ctx.fillText('Tiket Antrian', 200, 75);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 140px Arial';
    ctx.fillText(myQueue.number.toString(), 200, 250);

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#4F46E5';
    ctx.fillText(`Poli ${myQueue.clinic}`, 200, 310);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 200, 350);

    if (estimatedWait > 0) {
      ctx.fillText(`Estimasi Tunggu: ${estimatedWait} menit`, 200, 385);
    }

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 420);
    ctx.lineTo(360, 420);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#9CA3AF';
    ctx.setLineDash([]);
    ctx.fillText('Harap simpan tiket ini dengan baik', 200, 460);
    ctx.fillText('Terima kasih atas kunjungan Anda', 200, 490);

    const link = document.createElement('a');
    link.download = `tiket-antrian-${myQueue.number}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'WAITING': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CALLED': return 'bg-green-50 text-green-700 border-green-200 animate-pulse';
      case 'DONE': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'WAITING': return 'Menunggu';
      case 'CALLED': return 'Dipanggil';
      case 'DONE': return 'Selesai';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl animate-slide-in backdrop-blur-sm ${
          toast.type === 'success' ? 'bg-green-500/95' :
          toast.type === 'error' ? 'bg-red-500/95' : 'bg-blue-500/95'
        } text-white font-medium max-w-md border border-white/20`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-8">
            <h1 className="text-4xl font-bold text-white text-center">Sistem Antrian</h1>
            <p className="text-indigo-100 text-center mt-2 text-lg">Ambil Nomor Antrian Anda</p>
          </div>

          <div className="p-8 lg:p-10">
            {myQueue ? (
              <div className="space-y-6">
                <div className="relative">
                  <div className="text-center border-2 border-dashed border-indigo-300 rounded-2xl p-12 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <p className="text-gray-600 mb-4 text-sm uppercase tracking-wide font-medium">Nomor Antrian Anda</p>
                    <div className="text-9xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6">
                      {myQueue.number}
                    </div>
                    <div className="text-3xl font-semibold text-gray-800 mb-4">Poli {myQueue.clinic}</div>
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold border-2 ${getStatusColor(myQueue.status)}`}>
                      <span className="w-2 h-2 rounded-full bg-current"></span>
                      {getStatusText(myQueue.status)}
                    </div>
                  </div>
                </div>

                {currentCalled && myQueue.status === 'WAITING' && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Sedang Dipanggil</p>
                        <p className="text-sm text-amber-800 mt-1">Nomor {currentCalled}</p>
                      </div>
                    </div>
                  </div>
                )}

                {estimatedWait > 0 && myQueue.status === 'WAITING' && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Estimasi Waktu Tunggu</p>
                        <p className="text-sm text-blue-800 mt-1">{estimatedWait} menit</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={downloadTicket}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold transition-all duration-200 hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Tiket
                  </button>
                  {myQueue.status === 'WAITING' && (
                    <button
                      onClick={handleBatal}
                      className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-all duration-200 hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Batalkan
                    </button>
                  )}
                </div>

                {myQueue.status !== 'WAITING' && (
                  <button
                    onClick={handleResetQueue}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 font-semibold transition-all duration-200 hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ambil Nomor Baru
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-800 font-semibold mb-3 text-lg">
                    Pilih Poli / Bagian
                  </label>
                  <select
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-lg transition-all"
                  >
                    {CLINICS.map(c => (
                      <option key={c} value={c}>Poli {c}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAmbilNomor}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-xl font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      Ambil Nomor Antrian
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}