import React, { useState, useRef, useEffect } from 'react';
import { Menu, Server, CheckCircle2, AlertCircle, RefreshCw, X, Wifi } from 'lucide-react';
import { Api } from '../services/api';

interface HeaderBarProps {
  title: string;
  onOpenDrawer: () => void;
  onServerUrlChanged?: (newUrl: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onOpenDrawer,
  onServerUrlChanged
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => Api.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    const nextCount = tapCount + 1;
    if (nextCount >= 7) {
      setTapCount(0);
      setServerUrl(Api.getBaseUrl());
      setTestResult(null);
      setShowServerModal(true);
    } else {
      setTapCount(nextCount);
      tapTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 3000);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/v1/health`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (resp.ok) {
        const body = await resp.json();
        setTestResult({
          ok: true,
          message: `Connected! Server v${body.data?.version || '1.0.0'} (${body.data?.status || 'ok'})`
        });
      } else {
        setTestResult({
          ok: false,
          message: `Server returned HTTP ${resp.status} ${resp.statusText}`
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Unable to connect to server'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const clean = serverUrl.trim().replace(/\/+$/, '');
    if (!clean) return;
    Api.setBaseUrl(clean);
    setShowServerModal(false);
    if (onServerUrlChanged) {
      onServerUrlChanged(clean);
    }
  };

  const handleReset = () => {
    Api.resetBaseUrl();
    const current = Api.getBaseUrl();
    setServerUrl(current);
    setTestResult(null);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0E0E10] text-white border-b border-[#8A151B]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenDrawer}
              className="p-1.5 rounded-lg hover:bg-[#1C1C1E] active:scale-95 transition-all text-gray-200"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div
              onClick={handleLogoTap}
              className="cursor-pointer select-none active:opacity-75 transition-opacity"
              title="Tap 7 times to configure server"
            >
              <h1 className="text-base font-semibold text-white tracking-wide truncate max-w-[180px] sm:max-w-[240px]">
                {title}
              </h1>
            </div>
          </div>

          {/* Quick hidden tap badge feedback if tapping */}
          {tapCount > 2 && tapCount < 7 && (
            <span className="text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-700/50 px-2 py-0.5 rounded-full animate-pulse">
              {7 - tapCount} more taps
            </span>
          )}

          {/* Direct config button on far right */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setServerUrl(Api.getBaseUrl());
                setTestResult(null);
                setShowServerModal(true);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all"
              title="Server Settings"
              aria-label="Server Settings"
            >
              <Server className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#18181B] border border-gray-800 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide">Server Configuration</h3>
              </div>
              <button
                onClick={() => setShowServerModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Configure the library API base URL. Use laptop LAN IP (e.g. <span className="text-amber-300 font-mono">http://192.168.1.X:3000</span>) or public tunnel domain.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Server Base URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3000"
                className="w-full rounded-xl bg-[#242428] border border-gray-700 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                  testResult.ok
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/60 border-red-500/50 text-red-200'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span className="break-all">{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#8A151B] hover:bg-red-700 text-xs font-bold text-white transition-all shadow-md"
              >
                Save & Apply
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={handleReset}
                className="text-[11px] text-gray-400 hover:text-gray-200 underline"
              >
                Reset to Built-in Default
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};