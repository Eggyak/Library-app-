import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, Shield, Calendar, Phone, Mail, RefreshCw } from 'lucide-react';
import { Api } from '../services/api';
import { GeneralInfo, HolidayItem } from '../types';

interface LircInfoScreenProps {
  initialTab?: 'timings' | 'rules';
}

export const LircInfoScreen: React.FC<LircInfoScreenProps> = ({
  initialTab = 'timings'
}) => {
  const [tab, setTab] = useState<'timings' | 'rules'>(initialTab);
  const [info, setInfo] = useState<GeneralInfo | null>(null);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [infoRes, holidaysRes] = await Promise.all([
        Api.getGeneralInfo(),
        Api.getHolidays()
      ]);
      setInfo(infoRes.data);
      setHolidays(holidaysRes.data?.items || []);
    } catch (err) {
      console.warn('Failed to load LIRC info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    const handleResume = () => { if (document.visibilityState === 'visible') loadData(); };
    const poll = window.setInterval(handleResume, 20000);
    window.addEventListener('lirc:realtime:general_info', handleUpdate);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('lirc:realtime:general_info', handleUpdate);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  // Parse timings safely
  const timingsList = info?.timings || [];

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Tab bar */}
      <div className="flex border-b border-[#2C2C30]">
        <button
          onClick={() => setTab('timings')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            tab === 'timings' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>LIRC Hours & Holidays</span>
          {tab === 'timings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>

        <button
          onClick={() => setTab('rules')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            tab === 'rules' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>General Rules</span>
          {tab === 'rules' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>
      </div>

      {loading && !info && (
        <div className="text-center py-12 text-gray-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          <p>Loading LIRC schedule and guidelines...</p>
        </div>
      )}

      {/* TAB 1: TIMINGS & HOLIDAYS */}
      {tab === 'timings' && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-xs text-gray-300">
            <span className="font-bold text-white">LIRC Operational Timings: </span>
            The Learning & Information Resource Centre operates 7 days a week for university students, faculty, and research scholars.
          </div>

          {timingsList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FFA726] text-black shadow-md space-y-2 border border-amber-500"
            >
              <div className="text-center font-bold text-sm border-b-2 border-black/80 pb-1">
                {item.weekday}
              </div>

              <div className="flex items-center space-x-2 pt-1 font-semibold text-xs">
                <Clock className="w-4 h-4 shrink-0 text-black" />
                <span>Reading Hall: </span>
                <span className="font-bold ml-1">{item.opening} - {item.closing}</span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <Shield className="w-4 h-4 shrink-0 text-black/80" />
                <span>Circulation Desk: </span>
                <span className="font-bold ml-1">{item.opening} - {item.closing}</span>
              </div>

              {item.notes && (
                <div className="text-[11px] text-black/75 pt-1 italic border-t border-black/20">
                  {item.notes}
                </div>
              )}
            </div>
          ))}

          {/* Holiday Schedule */}
          {holidays.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 px-1">
                <Calendar className="w-4 h-4" />
                <span>Upcoming Library Holidays</span>
              </div>

              <div className="space-y-2">
                {holidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-2xl bg-[#1C1C1E] border border-gray-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{h.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{h.date}</div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        h.isClosed
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {h.isClosed ? 'CLOSED' : (h.specialOpening || h.specialClosing || 'SPECIAL HOURS')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Details */}
          {info?.contact && (info.contact.email || info.contact.phone) && (
            <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-gray-800 space-y-2 text-xs">
              <span className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">
                LIRC Helpdesk Contact
              </span>
              {info.contact.email && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-red-400" />
                  <a href={`mailto:${info.contact.email}`} className="underline hover:text-white">
                    {info.contact.email}
                  </a>
                </div>
              )}
              {info.contact.phone && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{info.contact.phone}</span>
                </div>
              )}
              {info.contact.address && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{info.contact.address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RULES */}
      {tab === 'rules' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-xs text-gray-200 leading-relaxed whitespace-pre-line">
            {info?.rulesMarkdown || 'General library rules and guidelines will appear here.'}
          </div>
        </div>
      )}
    </div>
  );
};
