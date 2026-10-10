import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { UserProfile } from '../types';

interface EngagementEvent {
  id: string;
  action: string;
  label: string;
  timestamp: string;
  icon?: React.ReactNode;
}

const STORAGE_KEY = 'nu_lirc_engagement_events';
const MAX_EVENTS = 20;

export function trackEngagement(action: string, label: string, icon?: React.ReactNode) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: EngagementEvent[] = raw ? JSON.parse(raw) : [];
    const newEvent: EngagementEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      label,
      timestamp: new Date().toISOString(),
      icon,
    };
    const updated = [newEvent, ...existing.slice(0, MAX_EVENTS - 1)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

interface EngagementTrackerProps {
  user?: UserProfile;
}

export const EngagementTracker: React.FC<EngagementTrackerProps> = ({ user: _user }) => {
  const [events, setEvents] = useState<EngagementEvent[]>([]);

  const loadEvents = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw));
      }
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();
    const handleRefresh = () => loadEvents();
    window.addEventListener('lirc:engagement:refresh', handleRefresh);
    return () => window.removeEventListener('lirc:engagement:refresh', handleRefresh);
  }, []);

  const clearEvents = () => {
    setEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const displayEvents = events.slice(0, 8);

  return (
    <section className="space-y-2.5" aria-label="Engagement Tracker">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Activity</h3>
        </div>
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            className="text-[10px] text-gray-500 hover:text-gray-300 underline"
            title="Clear activity history"
          >
            Clear All
          </button>
        )}
      </div>

      {displayEvents.length === 0 ? (
        <div className="p-3 rounded-xl bg-[#1C1C1E] border border-gray-800 text-center">
          <Activity className="w-5 h-5 mx-auto text-gray-600 mb-1" />
          <p className="text-[10px] text-gray-500">No activity recorded yet. Start exploring the app!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center space-x-3 p-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C30]"
            >
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {event.icon || <Activity className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{event.label}</p>
                <p className="text-[10px] text-gray-500">{event.action}</p>
              </div>
              <span className="text-[10px] text-gray-600 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
