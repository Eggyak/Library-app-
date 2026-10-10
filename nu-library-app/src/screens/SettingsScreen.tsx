import React, { useState } from 'react';
import {
  Moon,
  Bell,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface SettingsScreenProps {
  nfcSupported: boolean;
  nfcCardEnabled: boolean;
  onNfcCardEnabledChange: (enabled: boolean) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  nfcSupported,
  nfcCardEnabled,
  onNfcCardEnabledChange,
}) => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24 max-w-lg mx-auto">
      {/* Photo 2 exact settings items list */}
      <div className="space-y-1 divide-y divide-gray-800">
        {/* Dark Mode toggle */}
        <div className="flex items-center justify-between py-3.5 px-2">
          <span className="text-sm font-medium text-white">Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              darkMode ? 'bg-[#4CAF50]' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3.5 px-2">
          <div>
            <span className="text-sm font-medium text-white">Virtual NFC ID card</span>
            <span className="mt-1 block text-xs text-gray-400">
              {nfcSupported ? 'Web NFC API detected' : 'Web NFC API unavailable in this app'}
            </span>
            <span className="mt-1 block text-[11px] text-amber-300/80">Gate card emulation is not connected yet.</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={nfcCardEnabled}
            aria-label="Enable virtual NFC ID card"
            onClick={() => onNfcCardEnabledChange(!nfcCardEnabled)}
            className={`w-12 h-6 shrink-0 rounded-full transition-colors relative flex items-center px-0.5 ${
              nfcCardEnabled ? 'bg-[#4CAF50]' : 'bg-gray-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full bg-white transition-transform ${
              nfcCardEnabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between py-3.5 px-2 text-gray-300 hover:text-white cursor-pointer">
          <span className="text-sm font-medium">Notifications (Coming Soon)</span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between py-3.5 px-2 text-gray-300 hover:text-white cursor-pointer">
          <span className="text-sm font-medium">Privacy</span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 pt-3">Student access does not require an account.</p>

      <div className="text-center text-xs text-gray-600 pt-4 font-mono">
        NU LIRC Mobile App • Build 1.0.9 (Offline-First)
      </div>
    </div>
  );
};
