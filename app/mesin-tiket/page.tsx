'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  const [clinic, setClinic] = useState('Umum');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success'|'error'|'info'}>({
    show: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success'|'error'|'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleAmbilNomor = async () => {
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
      showToast('Nomor antrian berhasil diambil!', 'success');
    } catch (error) {
      showToast('Gagal mengambil nomor. Coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cetakNomor = () => {
    if (!myQueue) return;

    // Buat elemen untuk dicetak
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ticketHTML = `
      <html>
        <head>
          <title>Tiket Antrian</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .header { background-color: #1e40af; color: white; padding: 20px; }
            .number { font-size: 120px; font-weight: bold; color: #1e40af; }
            .clinic { font-size: 32px; font-weight: bold; color: #1e40af; }
            .date { font-size: 18px; color: #666; }
            .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RUMAH SAKIT</h1>
            <h2>Nomor Antrian</h2>
          </div>
          <div class="number">${myQueue.number}</div>
          <div class="clinic">${myQueue.clinic}</div>
          <div class="date">${new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
          <div class="footer">
            <p>Harap simpan tiket ini</p>
            <p>Terima kasih</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const reset = () => {
    setMyQueue(null);
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
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Mesin Ambil Tiket Antrian</h1>
          
          {myQueue ? (
            <div className="space-y-6">
              <div className="text-center border-4 border-dashed border-indigo-200 rounded-xl p-8 bg-indigo-50">
                <div className="text-gray-600 mb-2 text-lg">Nomor Antrian Anda</div>
                <div className="text-8xl font-bold text-indigo-600 mb-4">{myQueue.number}</div>
                <div className="text-2xl font-semibold text-gray-700 mb-2">{myQueue.clinic}</div>
                <div className="text-lg text-gray-600">{new Date().toLocaleDateString('id-ID')}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={cetakNomor}
                  className="px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  🖨️ Cetak Nomor
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                >
                  🔄 Ambil Nomor Baru
                </button>
              </div>
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
                  💡 Setelah ambil nomor, cetak tiket untuk referensi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informasi */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">ℹ️ Informasi</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Pilih poli dan ambil nomor antrian</li>
            <li>• Cetak nomor untuk disimpan</li>
            <li>• Tidak ada penyimpanan sesi di mesin ini</li>
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