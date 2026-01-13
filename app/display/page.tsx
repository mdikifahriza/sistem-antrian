'use client';

import { useState, useEffect, useRef } from 'react';

type Queue = {
  id: number;
  number: number;
  status: string;
  clinic: string;
  counter?: number;
};

export default function DisplayClient() {
  const [current, setCurrent] = useState<Queue | null>(null);
  const [next, setNext] = useState<Queue[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previousNumber = useRef<number | null>(null);

  // PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch queues
  const fetchQueues = async () => {
    try {
      const res = await fetch('/api/queue/status');
      const data = await res.json();

      if (data.current && data.current.number !== previousNumber.current) {
        playBeep();
        previousNumber.current = data.current.number;
      }

      setCurrent(data.current);
      setNext((data.waiting || []).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  };

  useEffect(() => {
    fetchQueues();
    const i = setInterval(fetchQueues, 3000);
    return () => clearInterval(i);
  }, []);

  // Beep sound
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 900;
      gain.gain.value = 0.25;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="h-[100dvh] w-screen bg-[#0b1220] text-white overflow-hidden relative">
      <div className="h-full grid grid-rows-[80px_1fr]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 border-b border-white/10">
          <div className="text-lg tracking-wide font-semibold">
            SISTEM ANTRIAN
          </div>

          <div className="text-2xl font-mono font-bold">
            {currentTime}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 border border-white/30 rounded hover:bg-white/10 transition-colors"
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
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-[2fr_1fr] h-full">

          {/* CURRENT */}
          <div className="flex flex-col justify-center items-center border-r border-white/10">

            <div className="text-4xl font-bold tracking-widest mb-4">
              SEDANG DIPANGGIL
            </div>

            {current ? (
              <>
                <div className="text-[12rem] leading-none font-extrabold">
                  {current.number}
                </div>

                <div className="text-4xl mt-4">
                  POLI {current.clinic.toUpperCase()}
                </div>

                {current.counter && (
                  <div className="text-4xl mt-2">
                    LOKET {current.counter}
                  </div>
                )}
              </>
            ) : (
              <div className="text-3xl opacity-60">
                MENUNGGU PANGGILAN
              </div>
            )}
          </div>

          {/* NEXT */}
          <div className="p-6 grid grid-rows-[auto_1fr]">
            <div className="text-2xl font-bold tracking-widest text-center mb-4">
              ANTRIAN BERIKUTNYA
            </div>

            <div className="grid grid-cols-2 gap-4">
              {next.map(q => (
                <div
                  key={q.id}
                  className="border border-white/20 rounded-lg flex flex-col items-center justify-center"
                >
                  <div className="text-5xl font-bold">{q.number}</div>
                  <div className="text-sm mt-1">POLI {q.clinic.toUpperCase()}</div>
                </div>
              ))}

              {[...Array(4 - next.length)].map((_, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-lg flex items-center justify-center opacity-30"
                >
                  -
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}