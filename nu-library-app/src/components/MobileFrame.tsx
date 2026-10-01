import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const [isFramed, setIsFramed] = useState(true);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center font-sans antialiased">
      {/* Desktop view switcher bar (visible only on md screens and above) */}
      <div className="hidden md:flex items-center space-x-3 my-2 px-4 py-1.5 rounded-full bg-[#18181B] border border-gray-800 text-xs text-gray-400 z-50">
        <span className="font-medium text-gray-300">Display Mode:</span>
        <button
          onClick={() => setIsFramed(true)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
            isFramed
              ? 'bg-[#8A151B] text-white font-medium shadow-xs'
              : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Phone (393 × 852)</span>
        </button>
        <button
          onClick={() => setIsFramed(false)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
            !isFramed
              ? 'bg-[#8A151B] text-white font-medium shadow-xs'
              : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Full Width Responsive</span>
        </button>
      </div>

      {/* Frame Container */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          isFramed
            ? 'md:w-[410px] md:h-[870px] md:max-h-[95vh] md:rounded-[44px] md:border-[10px] md:border-[#222226] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden bg-[#0E0E10]'
            : 'max-w-4xl min-h-screen bg-[#0E0E10] shadow-xl'
        }`}
      >
        {/* Simulated Android Status Bar in Phone Frame */}
        {isFramed && (
          <div className="hidden md:flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-gray-400 bg-[#0E0E10] select-none">
            <span>11:53</span>
            <div className="w-24 h-4 bg-black/70 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c20] border border-gray-700" />
            </div>
            <div className="flex items-center space-x-1.5 text-[10px]">
              <span>5G</span>
              <span className="font-bold">98%</span>
            </div>
          </div>
        )}

        {/* Inner App Content */}
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-[#0E0E10] relative">
          {children}
        </div>

        {/* Android Home Navigation Bar Pill */}
        {isFramed && (
          <div className="hidden md:flex items-center justify-center py-2 bg-[#0E0E10]">
            <div className="w-32 h-1 bg-gray-600 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};