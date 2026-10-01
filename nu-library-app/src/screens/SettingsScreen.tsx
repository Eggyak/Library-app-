import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Bell,
  Lock,
  RotateCcw,
  Shield,
  GraduationCap,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface SettingsScreenProps {
  currentUser: UserProfile | null;
  nfcSupported: boolean;
  nfcCardEnabled: boolean;
  onNfcCardEnabledChange: (enabled: boolean) => void;
  onToggleRole: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  nfcSupported,
  nfcCardEnabled,
  onNfcCardEnabledChange,
  onToggleRole,
  onRefreshData,
  onLogout
}) => {
  const [darkMode, setDarkMode] = useState(true);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    if (confirm('Reset all demo bookings, news clippings, and reading logs to original factory data?')) {
      StorageService.resetAllData();
      setResetDone(true);
      onRefreshData();
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24 max-w-lg mx-auto">
      {resetDone && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Application state reset to authentic default data.</span>
        </div>
      )}

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

      {/* Role Switcher */}
      <div className="pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Role & Access Mode
        </h4>
        <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Active Identity:</span>
              <span className="text-sm font-bold text-white">
                {currentUser?.name} ({currentUser?.role.toUpperCase()})
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {currentUser?.role === 'admin' ? 'Librarian' : 'Student'}
            </span>
          </div>

          <button
            onClick={onToggleRole}
            className="w-full py-2.5 rounded-xl bg-[#8A151B] hover:bg-red-700 text-white font-semibold text-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5"
          >
            {currentUser?.role === 'admin' ? (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Switch to Student Mode (Yash Kumar)</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Switch to Librarian Admin Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reset Data & Logout */}
      <div className="pt-2 space-y-2">
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-2xl bg-[#1C1C1E] hover:bg-[#242428] border border-gray-800 text-gray-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span>Reset Demo Data to Original Defaults</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
        >
          <span>Log Out of Application</span>
        </button>
      </div>

      <div className="text-center text-xs text-gray-600 pt-4 font-mono">
        NU LIRC Mobile App • Build 1.0.9 (Offline-First)
      </div>
    </div>
  );
};