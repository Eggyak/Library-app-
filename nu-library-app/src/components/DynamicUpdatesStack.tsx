import React, { useState, useEffect } from 'react';
import { Bell, X, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Api, realtimeManager } from '../services/api';
import { AnnouncementItem } from '../types';

const STORAGE_KEY = 'nu_lirc_user_dismissed_updates';

function getDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export const DynamicUpdatesStack: React.FC = () => {
  const [updates, setUpdates] = useState<AnnouncementItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const visibleUpdates = updates.filter(u => !dismissedIds.includes(u.id));

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const res = await Api.getAnnouncements();
      setUpdates(res.data?.items || []);
    } catch (err) {
      console.warn('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDismissedIds(getDismissedIds());
    loadUpdates();

    const unsubscribe = realtimeManager.subscribe(event => {
      if (event.module === 'general_info') loadUpdates();
    });
    const handleResume = () => { if (document.visibilityState === 'visible') loadUpdates(); };
    const poll = window.setInterval(handleResume, 20000);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', handleResume);
      unsubscribe();
    };
  }, []);

  const dismissUpdate = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    saveDismissedIds(newDismissed);
  };

  const clearAll = () => {
    const newDismissed = updates.map(u => u.id);
    setDismissedIds(newDismissed);
    saveDismissedIds(newDismissed);
  };

  const resetDismissed = () => {
    setDismissedIds([]);
    saveDismissedIds([]);
  };

  if (visibleUpdates.length === 0 && dismissedIds.length === 0) {
    return null;
  }

  if (visibleUpdates.length === 0) {
    return (
      <section className="space-y-2" aria-label="Library Updates">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Library Updates</h3>
          </div>
          <button
            onClick={resetDismissed}
            className="text-[10px] text-gray-500 hover:text-gray-300 underline"
          >
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Restore All
          </button>
        </div>
        <div className="p-3 rounded-xl bg-[#1C1C1E] border border-gray-800 text-center">
          <Bell className="w-5 h-5 mx-auto text-gray-600 mb-1" />
          <p className="text-[10px] text-gray-500">All announcements dismissed.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2" aria-label="Library Updates">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Library Updates ({visibleUpdates.length})
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={clearAll}
            className="text-[10px] text-gray-500 hover:text-gray-300 underline"
            title="Dismiss all visible updates"
          >
            Clear All
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-[10px] text-gray-500">Refreshing announcements...</div>
      )}

      {expanded && (
        <div className="space-y-2">
          {visibleUpdates.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-1.5 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Bell className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Announcement
                    </span>
                    {item.startsAt && (
                      <span className="text-[9px] text-gray-500">
                        {new Date(item.startsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                </div>
                <button
                  onClick={() => dismissUpdate(item.id)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#2C2C30] transition-all shrink-0"
                  title="Dismiss this update"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {item.body && (
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                  {item.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
