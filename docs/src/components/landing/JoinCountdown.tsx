'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function JoinCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Target: 17 November 23:59:00 WIB (UTC+7)
    const targetDate = new Date('2026-11-17T23:59:00+07:00').getTime();

    const calculateTime = () => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="join" className="w-full bg-white border-b border-gray-200 py-14 sm:py-16 px-6 sm:px-12 text-center relative z-20">
      <div className="max-w-4xl mx-auto">
        {/* Recruitment Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-undip-blue bg-blue-50 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-accent-yellow animate-ping" />
          Open Recruitment
        </div>

        {/* Heading */}
        <h2 className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-gray-900 mb-4 tracking-tighter uppercase">
          Join Us!
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          We are recruiting students from Universitas Diponegoro for the{' '}
          <span className="font-bold text-gray-900">2027 season</span>. No prior robotics experience required—just a hunger to learn.
        </p>

        {/* Countdown Timer */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-wide uppercase text-gray-500 mb-4">
            <Clock size={16} className="text-accent-yellow" />
            <span>Registration closes in (Ends on Nov 17, 23:59 WIB)</span>
          </div>

          <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6 font-mono">
            {/* Days */}
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-5 min-w-[70px] sm:min-w-[95px] shadow-sm">
              <span className="font-display font-black text-2xl sm:text-4xl text-gray-900">
                {mounted ? String(timeLeft.days).padStart(2, '0') : '--'}
              </span>
              <span className="text-[10px] sm:text-xs font-sans uppercase font-bold text-gray-400 mt-1">
                Days
              </span>
            </div>

            <span className="text-xl sm:text-3xl font-bold text-gray-300 -mt-4">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-5 min-w-[70px] sm:min-w-[95px] shadow-sm">
              <span className="font-display font-black text-2xl sm:text-4xl text-gray-900">
                {mounted ? String(timeLeft.hours).padStart(2, '0') : '--'}
              </span>
              <span className="text-[10px] sm:text-xs font-sans uppercase font-bold text-gray-400 mt-1">
                Hours
              </span>
            </div>

            <span className="text-xl sm:text-3xl font-bold text-gray-300 -mt-4">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-5 min-w-[70px] sm:min-w-[95px] shadow-sm">
              <span className="font-display font-black text-2xl sm:text-4xl text-gray-900">
                {mounted ? String(timeLeft.minutes).padStart(2, '0') : '--'}
              </span>
              <span className="text-[10px] sm:text-xs font-sans uppercase font-bold text-gray-400 mt-1">
                Minutes
              </span>
            </div>

            <span className="text-xl sm:text-3xl font-bold text-gray-300 -mt-4">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-2xl p-3 sm:p-5 min-w-[70px] sm:min-w-[95px] shadow-sm">
              <span className="font-display font-black text-2xl sm:text-4xl text-undip-blue">
                {mounted ? String(timeLeft.seconds).padStart(2, '0') : '--'}
              </span>
              <span className="text-[10px] sm:text-xs font-sans uppercase font-bold text-gray-400 mt-1">
                Seconds
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <a
            href="https://forms.gle/Bbe5BqmFPrggyty3A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg text-base sm:text-lg group"
          >
            Apply Now (Google Form)
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
