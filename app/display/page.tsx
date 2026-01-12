'use client';

import { useState, useEffect, useRef } from 'react';

type Queue = {
  id: number;
  number: number;
  status: string;
  clinic: string;
  counter?: number;
};

export default function Display() {
  const [current, setCurrent] = useState<Queue | null>(null);
  const [next, setNext] = useState<Queue[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDark, setIsDark] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<string>('ALL');
  const previousNumber = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const CLINICS = ['ALL', 'Umum', 'Gigi', 'Anak', 'Mata', 'THT', 'Jantung'];

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const fetchQueues = async () => {
    const res = await fetch('/api/queue/status');
    const data = await res.json();
    
    // Play sound if number changed
    if (data.current && data.current.number !== previousNumber.current) {
      playNotificationSound();
      previousNumber.current = data.current.number;
    }

    setCurrent(data.current);
    
    let waitingQueues = data.waiting || [];
    if (selectedClinic !== 'ALL') {
      waitingQueues = waitingQueues.filter((q: Queue) => q.clinic === selectedClinic);
    }
    setNext(waitingQueues.slice(0, 3));
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 3000);
    return () => clearInterval(interval);
  }, [selectedClinic]);

  const playNotificationSound = () => {
    // Create simple beep sound using Web Audio API
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const bgClass = isDark 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
    : 'bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700';

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-700';
  const primaryColor = isDark ? 'text-green-400' : 'text-green-600';

  return (
    <div className={`min-h-screen ${bgClass} p-8 transition-colors duration-500`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div className={`${isDark ? 'text-white' : 'text-white'}`}>
            <h1 className="text-4xl font-bold">🏥 RUMAH SAKIT</h1>
            <p className="text-xl mt-1">Sistem Antrian Digital</p>
          </div>
          <div className={`text-right ${isDark ? 'text-white' : 'text-white'}`}>
            <div className="text-4xl font-bold font-mono">{formatTime(currentTime)}</div>
            <div className="text-lg mt-1">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="px-6 py-3 rounded-lg font-semibold text-lg bg-white/20 text-white border-2 border-white/30 backdrop-blur"
        >
          {CLINICS.map(c => (
            <option key={c} value={c} className="text-gray-900">
              {c === 'ALL' ? 'Semua Poli' : `Poli ${c}`}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsDark(!isDark)}
          className="px-6 py-3 bg-white/20 text-white rounded-lg font-semibold backdrop-blur border-2 border-white/30 hover:bg-white/30 transition-colors"
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Current Called */}
        <div className={`${cardBg} rounded-3xl shadow-2xl p-12 transform transition-all duration-300`}>
          <h2 className={`text-4xl font-bold mb-8 text-center ${textColor}`}>
            🔔 SEDANG DIPANGGIL
          </h2>
          {current ? (
            <div className="text-center animate-fade-in">
              <div className={`text-[14rem] font-bold ${primaryColor} leading-none mb-6 animate-pulse-slow`}>
                {current.number}
              </div>
              <div className={`text-5xl font-semibold ${textColor} mb-4`}>
                Poli {current.clinic}
              </div>
              {current.counter && (
                <div className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl text-3xl font-bold">
                  Loket {current.counter}
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center ${isDark ? 'text-gray-600' : 'text-gray-400'} text-6xl py-16`}>
              Menunggu Panggilan...
            </div>
          )}
        </div>

        {/* Next Queue */}
        <div className={`${cardBg} rounded-3xl shadow-2xl p-12`}>
          <h2 className={`text-4xl font-bold mb-10 text-center ${textColor}`}>
            📋 ANTRIAN BERIKUTNYA
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {next.map((q, idx) => (
              <div 
                key={q.id} 
                className={`${
                  isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
                } rounded-3xl p-10 text-center transform hover:scale-105 transition-transform shadow-lg`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`text-8xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-4`}>
                  {q.number}
                </div>
                <div className={`text-2xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {q.clinic}
                </div>
              </div>
            ))}
            {[...Array(3 - next.length)].map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className={`${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-100'
                } rounded-3xl p-10 text-center`}
              >
                <div className={`text-8xl font-bold ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                  -
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className={`${cardBg} rounded-2xl shadow-xl p-8`}>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className={`text-3xl font-bold ${primaryColor}`}>
                {current ? current.number : 0}
              </div>
              <div className={`text-lg ${textColor} mt-2`}>Sedang Dilayani</div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {next.length}
              </div>
              <div className={`text-lg ${textColor} mt-2`}>Antrian Berikutnya</div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {selectedClinic === 'ALL' ? 'Semua' : selectedClinic}
              </div>
              <div className={`text-lg ${textColor} mt-2`}>Poli Aktif</div>
            </div>
          </div>
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-center animate-pulse-slow">
          <p className="text-white text-2xl font-bold">
            💡 Harap perhatikan nomor antrian Anda di layar
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}