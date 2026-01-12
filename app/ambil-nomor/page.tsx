'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

        // Notifikasi jika nomor dipanggil
        if (data.queue?.status === 'CALLED' && !showNotif) {
          setShowNotif(true);
          showToast('🔔 NOMOR ANDA DIPANGGIL! Silakan ke loket.', 'success');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nomor Anda Dipanggil!', {
              body: `Nomor ${myQueue.number} - ${myQueue.clinic}`,
              icon: '/icon.png'
            });
          }
        }

        // Notifikasi jika hampir dipanggil (2 nomor lagi)
        if (data.waitingBefore === 2 && myQueue.status === 'WAITING') {
          showToast('⚠️ Nomor Anda akan segera dipanggil!', 'info');
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
      showToast('Gagal mengambil nomor. Coba lagi.', 'error');
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
        setMyQueue(null);
        localStorage.removeItem('myQueue');
        showToast('Antrian dibatalkan', 'info');
      }
    } catch (error) {
      showToast('Gagal membatalkan', 'error');
    }
  };

  const downloadTicket = () => {
    if (!myQueue) return;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 500);

    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, 400, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RUMAH SAKIT', 200, 35);
    ctx.font = '18px Arial';
    ctx.fillText('Nomor Antrian', 200, 65);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 120px Arial';
    ctx.fillText(myQueue.number.toString(), 200, 220);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#1e40af';
    ctx.fillText(myQueue.clinic, 200, 280);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 200, 320);

    if (estimatedWait > 0) {
      ctx.fillText(`Est. Tunggu: ${estimatedWait} menit`, 200, 360);
    }

    ctx.strokeStyle = '#cccccc';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(50, 400);
    ctx.lineTo(350, 400);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText('Harap simpan tiket ini', 200, 430);
    ctx.fillText('Terima kasih', 200, 460);

    const link = document.createElement('a');
    link.download = `tiket-${myQueue.number}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'WAITING': return 'bg-blue-100 text-blue-800';
      case 'CALLED': return 'bg-green-100 text-green-800 animate-pulse';
      case 'DONE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'WAITING': return 'Menunggu';
      case 'CALLED': return '🔔 DIPANGGIL';
      case 'DONE': return 'Selesai';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white font-semibold max-w-md`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          ← Kembali ke Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Ambil Nomor Antrian</h1>
          
          {myQueue ? (
            <div className="space-y-6">
              <div className="text-center border-4 border-dashed border-indigo-200 rounded-xl p-8 bg-indigo-50">
                <div className="text-gray-600 mb-2 text-lg">Nomor Antrian Anda</div>
                <div className="text-8xl font-bold text-indigo-600 mb-4">{myQueue.number}</div>
                <div className="text-2xl font-semibold text-gray-700 mb-2">{myQueue.clinic}</div>
                <div className={`inline-block px-6 py-2 rounded-full text-lg font-semibold ${getStatusColor(myQueue.status)}`}>
                  {getStatusText(myQueue.status)}
                </div>
              </div>

              {currentCalled && myQueue.status === 'WAITING' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">⏳</div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Sedang dipanggil: </span>
                        Nomor {currentCalled}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {estimatedWait > 0 && myQueue.status === 'WAITING' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">⏱️</div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Estimasi waktu tunggu: </span>
                        {estimatedWait} menit
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadTicket}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  📥 Download Tiket
                </button>
                {myQueue.status === 'WAITING' && (
                  <button
                    onClick={handleBatal}
                    className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                  >
                    ❌ Batalkan
                  </button>
                )}
              </div>

              {myQueue.status !== 'WAITING' && (
                <button
                  onClick={() => {
                    setMyQueue(null);
                    localStorage.removeItem('myQueue');
                  }}
                  className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                >
                  Ambil Nomor Baru
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-3 text-lg">
                  Pilih Poli / Bagian
                </label>
                <select
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                >
                  {CLINICS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAmbilNomor}
                disabled={loading}
                className="w-full px-6 py-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-xl font-bold transition-colors transform hover:scale-105 active:scale-95"
              >
                {loading ? '⏳ Memproses...' : '🎫 Ambil Nomor Antrian'}
              </button>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  💡 Simpan nomor antrian Anda. Sistem akan memberitahu saat nomor Anda dipanggil.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Riwayat */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">ℹ️ Informasi</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Nomor akan tersimpan otomatis di perangkat Anda</li>
            <li>• Notifikasi muncul saat nomor Anda hampir/sudah dipanggil</li>
            <li>• Estimasi waktu tunggu: ~5 menit per antrian</li>
            <li>• Download tiket untuk backup</li>
          </ul>
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