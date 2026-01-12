'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Queue = {
  id: number;
  number: number;
  status: string;
  clinic: string;
  created_at: string;
  called_at?: string;
  counter?: number;
};

type Stats = {
  total: number;
  waiting: number;
  called: number;
  done: number;
  skipped: number;
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'control' | 'all'>('control');
  const [current, setCurrent] = useState<Queue | null>(null);
  const [waiting, setWaiting] = useState<Queue[]>([]);
  const [allQueues, setAllQueues] = useState<Queue[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, waiting: 0, called: 0, done: 0, skipped: 0 });
  const [filterClinic, setFilterClinic] = useState<string>('ALL');
  const [counter, setCounter] = useState(1);
  const [chartData, setChartData] = useState<{hour: number; count: number}[]>([]);

  const CLINICS = ['ALL', 'Umum', 'Gigi', 'Anak', 'Mata', 'THT', 'Jantung'];

  const fetchQueues = async () => {
    const res = await fetch('/api/queue/status');
    const data = await res.json();
    setCurrent(data.current);
    setWaiting(data.waiting);
  };

  const fetchAllQueues = async () => {
    const res = await fetch('/api/queue/all');
    const data = await res.json();
    setAllQueues(data.queues || []);
    setStats(data.stats || { total: 0, waiting: 0, called: 0, done: 0, skipped: 0 });
    setChartData(data.hourlyData || []);
  };

  useEffect(() => {
    fetchQueues();
    fetchAllQueues();
    const interval = setInterval(() => {
      fetchQueues();
      fetchAllQueues();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = async () => {
    await fetch('/api/queue/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counter })
    });
    fetchQueues();
    fetchAllQueues();
  };

  const handleSkip = async () => {
    if (!current) return;
    await fetch('/api/queue/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id })
    });
    fetchQueues();
    fetchAllQueues();
  };

  const handleReset = async () => {
    if (confirm('Reset semua antrian hari ini?')) {
      await fetch('/api/queue/reset', { method: 'POST' });
      fetchQueues();
      fetchAllQueues();
    }
  };

  const handleRecall = async (id: number) => {
    await fetch('/api/queue/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, counter })
    });
    fetchQueues();
    fetchAllQueues();
  };

  const handleChangeClinic = async (id: number) => {
    const newClinic = prompt('Pindah ke poli mana?', 'Umum');
    if (!newClinic) return;
    
    await fetch('/api/queue/change-clinic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, clinic: newClinic })
    });
    fetchAllQueues();
  };

  const exportToCSV = () => {
    const headers = ['Nomor', 'Poli', 'Status', 'Waktu Ambil', 'Waktu Panggil', 'Loket'];
    const rows = allQueues.map(q => [
      q.number,
      q.clinic,
      q.status,
      new Date(q.created_at).toLocaleTimeString('id-ID'),
      q.called_at ? new Date(q.called_at).toLocaleTimeString('id-ID') : '-',
      q.counter || '-'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antrian-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredQueues = filterClinic === 'ALL' 
    ? allQueues 
    : allQueues.filter(q => q.clinic === filterClinic);

  const getStatusBadge = (status: string) => {
    const styles = {
      WAITING: 'bg-blue-100 text-blue-800',
      CALLED: 'bg-green-100 text-green-800',
      DONE: 'bg-gray-100 text-gray-800',
      SKIPPED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-1">Kelola antrian rumah sakit</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            ← Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('control')}
              className={`flex-1 px-6 py-4 font-semibold text-lg ${
                activeTab === 'control' 
                  ? 'border-b-4 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎛️ Kontrol Antrian
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-semibold text-lg ${
                activeTab === 'all' 
                  ? 'border-b-4 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Semua Antrian
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'control' ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-gray-600 mt-1">Total</div>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-blue-600">{stats.waiting}</div>
                <div className="text-blue-800 mt-1">Menunggu</div>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-green-600">{stats.called}</div>
                <div className="text-green-800 mt-1">Dipanggil</div>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-gray-600">{stats.done}</div>
                <div className="text-gray-800 mt-1">Selesai</div>
              </div>
              <div className="bg-red-50 rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-red-600">{stats.skipped}</div>
                <div className="text-red-800 mt-1">Dilewati</div>
              </div>
            </div>

            {/* Current Called */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sedang Dipanggil</h2>
                <div className="flex items-center gap-3">
                  <label className="text-gray-700 font-semibold">Loket:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={counter}
                    onChange={(e) => setCounter(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-center font-bold"
                  />
                </div>
              </div>
              {current ? (
                <div className="text-center border-4 border-green-500 rounded-xl p-8 bg-green-50">
                  <div className="text-9xl font-bold text-green-600 mb-4 animate-pulse">{current.number}</div>
                  <div className="text-3xl font-semibold text-gray-800 mb-2">{current.clinic}</div>
                  <div className="text-xl text-gray-600">Loket {current.counter || '-'}</div>
                </div>
              ) : (
                <div className="text-center text-gray-400 text-3xl py-12">Belum ada yang dipanggil</div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleNext}
                className="px-6 py-5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-xl shadow-lg transform hover:scale-105 transition-transform"
              >
                ▶️ Panggil Berikutnya
              </button>
              <button
                onClick={handleSkip}
                disabled={!current}
                className="px-6 py-5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 font-bold text-xl shadow-lg transform hover:scale-105 transition-transform"
              >
                ⏭️ Lewati
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xl shadow-lg transform hover:scale-105 transition-transform"
              >
                🔄 Reset Hari Ini
              </button>
            </div>

            {/* Waiting Queue */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Antrian Menunggu ({waiting.length})</h2>
              <div className="grid grid-cols-6 gap-3">
                {waiting.slice(0, 12).map((q) => (
                  <div 
                    key={q.id} 
                    className="bg-blue-100 p-4 rounded-lg text-center cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => handleRecall(q.id)}
                    title={`Klik untuk panggil ulang\n${q.clinic}`}
                  >
                    <div className="font-bold text-3xl text-blue-800">{q.number}</div>
                    <div className="text-xs text-blue-600 mt-1">{q.clinic}</div>
                  </div>
                ))}
              </div>
              {waiting.length > 12 && (
                <div className="text-center text-gray-500 mt-4">
                  +{waiting.length - 12} antrian lainnya
                </div>
              )}
            </div>

            {/* Hourly Chart */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">📈 Grafik Pasien per Jam</h2>
              <div className="flex items-end gap-2 h-64">
                {chartData.map((data) => (
                  <div key={data.hour} className="flex-1 flex flex-col items-center">
                    <div className="text-sm font-semibold text-gray-700 mb-1">{data.count}</div>
                    <div 
                      className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors"
                      style={{ height: `${(data.count / maxCount) * 100}%`, minHeight: data.count > 0 ? '20px' : '0' }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{data.hour}:00</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter & Export */}
            <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700">Filter Poli:</label>
                <select
                  value={filterClinic}
                  onChange={(e) => setFilterClinic(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  {CLINICS.map(c => (
                    <option key={c} value={c}>{c === 'ALL' ? 'Semua' : c}</option>
                  ))}
                </select>
                <span className="text-gray-600">({filteredQueues.length} antrian)</span>
              </div>
              <button
                onClick={exportToCSV}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Nomor</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Poli</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Waktu Ambil</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Waktu Panggil</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Loket</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredQueues.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-bold text-2xl text-gray-900">{q.number}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">{q.clinic}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(q.created_at).toLocaleTimeString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {q.called_at ? new Date(q.called_at).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-semibold">
                          {q.counter || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {q.status === 'WAITING' && (
                              <>
                                <button
                                  onClick={() => handleRecall(q.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                                >
                                  Panggil
                                </button>
                                <button
                                  onClick={() => handleChangeClinic(q.id)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                                >
                                  Pindah
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}