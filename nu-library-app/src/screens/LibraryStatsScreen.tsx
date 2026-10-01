import React, { useState } from 'react';
import {
  History,
  Clock,
  BookOpen,
  Calendar,
  RotateCw,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Award,
  ChevronRight
} from 'lucide-react';
import { IssuedBook, LibraryVisit, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface LibraryStatsScreenProps {
  user: UserProfile;
  issuedBooks: IssuedBook[];
  visits: LibraryVisit[];
  onRefreshData: () => void;
}

export const LibraryStatsScreen: React.FC<LibraryStatsScreenProps> = ({
  user,
  issuedBooks,
  visits,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'visits'>('current');
  const [renewNotice, setRenewNotice] = useState<string | null>(null);

  const activeBooks = issuedBooks.filter(b => b.status === 'active');
  const pastBooks = issuedBooks.filter(b => b.status === 'returned');

  // Compute total study hours
  const totalMinutes = visits.reduce((acc, v) => acc + v.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgMinutesPerVisit = visits.length > 0 ? Math.round(totalMinutes / visits.length) : 0;

  const handleRenew = (bookId: string) => {
    StorageService.renewBook(bookId);
    onRefreshData();
    setRenewNotice('Book loan successfully renewed for 14 additional days!');
    setTimeout(() => setRenewNotice(null), 3500);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 to-[#1C1C1E] border border-emerald-500/40 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">
              Student Library Analytics
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            GOOD STANDING
          </span>
        </div>
        <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
          Official record of library attendance, reading hours, and book circulation for {user.name} ({user.enrollmentNo}).
        </p>
      </div>

      {renewNotice && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{renewNotice}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Visits */}
        <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30]">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Library Visits</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-white">{visits.length}</span>
            <span className="text-xs text-gray-400">check-ins</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">
            Ranked Top 10% in CSE batch
          </p>
        </div>

        {/* Total Hours */}
        <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30]">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Total Hours</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-white">{totalHours}</span>
            <span className="text-xs text-gray-400">hrs</span>
          </div>
          <p className="text-[10px] text-amber-400 mt-1">
            ~{avgMinutesPerVisit} mins avg per session
          </p>
        </div>

        {/* Current Borrowed */}
        <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30]">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Present Books</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-white">{activeBooks.length}</span>
            <span className="text-xs text-gray-400">issued</span>
          </div>
          <p className="text-[10px] text-blue-400 mt-1">
            Quota: 2 / 5 books used
          </p>
        </div>

        {/* Past History & Fine */}
        <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30]">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Library Fines</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-emerald-400">₹0.00</span>
            <span className="text-xs text-gray-400">clear</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {pastBooks.length} books returned safely
          </p>
        </div>
      </div>

      {/* Tabs (TimeTable Style) */}
      <div className="flex border-b border-[#2C2C30]">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            activeTab === 'current' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>Present Books ({activeBooks.length})</span>
          {activeTab === 'current' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            activeTab === 'history' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>Past Borrowed ({pastBooks.length})</span>
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            activeTab === 'visits' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>Visit Log ({visits.length})</span>
          {activeTab === 'visits' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>
      </div>

      {/* TAB 1: PRESENT ISSUED BOOKS */}
      {activeTab === 'current' && (
        <div className="space-y-3">
          {activeBooks.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-400">ISBN: {b.isbn}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                    {b.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">By {b.author}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  ACTIVE LOAN
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#121214] p-2.5 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 text-[10px] block uppercase">Issued Date</span>
                  <span className="font-medium text-white">{b.issueDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block uppercase">Return Due Date</span>
                  <span className="font-bold text-amber-400">{b.dueDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">
                  Renewals applied: <span className="text-white font-medium">{b.renewalCount}/2</span>
                </span>

                <button
                  onClick={() => handleRenew(b.id)}
                  disabled={b.renewalCount >= 2}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    b.renewalCount < 2
                      ? 'bg-[#8A151B] hover:bg-red-700 text-white shadow-md active:scale-95'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Renew (+14 Days)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PAST ISSUED BOOKS */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {pastBooks.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-400">ISBN: {b.isbn}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {b.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">By {b.author}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  RETURNED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#121214] p-2 rounded-xl border border-gray-800 text-gray-300">
                <div>
                  <span className="text-gray-500 text-[10px] block uppercase">Issued On</span>
                  <span>{b.issueDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block uppercase">Returned On</span>
                  <span className="text-emerald-400 font-medium">{b.returnDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: VISIT LOGS */}
      {activeTab === 'visits' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-gray-400 font-medium">Physical Entry & Reading Sessions</span>
            <span className="text-xs text-gray-500">Use RFID Card at Gate</span>
          </div>

          {visits.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-white">{v.date}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {v.entryTime} {v.exitTime ? `- ${v.exitTime}` : '(Active)'} • {v.purpose}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {v.durationMinutes} min
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};