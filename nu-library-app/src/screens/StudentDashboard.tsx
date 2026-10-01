import React, { useState } from 'react';
import {
  Newspaper,
  Search,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  CreditCard,
  Radio
} from 'lucide-react';
import { UserProfile, DiscussionRoomBooking, NewsClipping, IssuedBook, LibraryVisit } from '../types';
import { StorageService } from '../services/storage';
import { NEW_ARRIVALS_BOOKS } from '../data/newArrivalsData';

interface StudentDashboardProps {
  user: UserProfile;
  nfcSupported: boolean;
  nfcCardEnabled: boolean;
  bookings: DiscussionRoomBooking[];
  news: NewsClipping[];
  issuedBooks: IssuedBook[];
  visits: LibraryVisit[];
  onNavigate: (screen: any, query?: string) => void;
  onRefreshData: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  nfcSupported,
  nfcCardEnabled,
  bookings,
  news,
  issuedBooks,
  visits,
  onNavigate,
  onRefreshData
}) => {
  const [dashSearchInput, setDashSearchInput] = useState('');
  const [showVirtualId, setShowVirtualId] = useState(false);
  const activeBooks = issuedBooks.filter(b => b.status === 'active');
  const myBookings = bookings.filter(b => b.enrollmentNo === user.enrollmentNo);
  const approvedBooking = myBookings.find(b => b.status === 'approved');
  const latestNews = news[0];

  // Calculate total hours
  const totalMinutes = visits.reduce((acc, v) => acc + v.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleRenew = (bookId: string) => {
    StorageService.renewBook(bookId);
    onRefreshData();
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in text-white pb-20">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8A151B] to-[#5C0E12] p-5 shadow-xl border border-red-900/50">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
              Welcome back
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {user.name}
            </h2>
            <p className="text-xs text-red-200/80 mt-1">
              {user.enrollmentNo}
            </p>
          </div>
        </div>

      </div>

      {user.role === 'student' && nfcSupported && nfcCardEnabled && (
        <section className="space-y-2" aria-label="Virtual student ID">
          <button
            type="button"
            onClick={() => setShowVirtualId((visible) => !visible)}
            aria-expanded={showVirtualId}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#202326] border border-emerald-700/60 text-left hover:border-emerald-500 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300"><CreditCard className="w-5 h-5" /></span>
              <span>
                <span className="block text-sm font-semibold text-white">Virtual student ID</span>
                <span className="block text-xs text-gray-400">Tap to view your library card</span>
              </span>
            </span>
            <Radio className="w-5 h-5 text-emerald-300" />
          </button>

          {showVirtualId && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-700/60 bg-gradient-to-br from-[#173b32] via-[#172a2a] to-[#262326] p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">NIIT University · LIRC</p>
                  <h3 className="mt-4 text-lg font-bold text-white">{user.name}</h3>
                  <p className="mt-1 text-xs text-emerald-100/75">{user.enrollmentNo}</p>
                </div>
                <CreditCard className="w-7 h-7 text-emerald-200" />
              </div>
              <div className="mt-5 border-t border-white/15 pt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-emerald-100/60">Demo RFID number</p>
                  <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-white">{user.rfidNumber || 'NU-8472-1936'}</p>
                </div>
                <span className="shrink-0 rounded-md border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-semibold uppercase text-amber-200">Preview only</span>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-gray-300">This demo card is not yet connected to the library gate. Your official RFID credential must be provided by the university.</p>
            </div>
          )}
        </section>
      )}

      {/* Book search */}
      <div className="p-3.5 rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#1C1C1E] to-[#1C1C1E] border border-purple-500/40 shadow-xl space-y-2.5">
        <h3 className="text-sm font-semibold text-white">Koha OPAC Search</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate('opac_catalog', dashSearchInput.trim());
          }}
          className="relative flex items-center"
        >
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Type topic (e.g. Deadlocks), book, or ISBN..."
            value={dashSearchInput}
            onChange={(e) => setDashSearchInput(e.target.value)}
            className="w-full bg-[#141416] border border-gray-700/80 rounded-2xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-purple-500 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all active:scale-95"
            title="Search"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

      {/* Library Quick Stats (Photo 4 & 3 style) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Library Engagement Tracker
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Visits card */}
          <div
            onClick={() => onNavigate('library_stats')}
            className="cursor-pointer p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all group active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Total Visits</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{visits.length}</span>
              <span className="text-xs text-gray-400">times</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 font-medium">
              +3 visits this week
            </p>
          </div>

          {/* Hours card */}
          <div
            onClick={() => onNavigate('library_stats')}
            className="cursor-pointer p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all group active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Study Time</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{totalHours}</span>
              <span className="text-xs text-gray-400">hrs</span>
            </div>
            <p className="text-[11px] text-amber-400 mt-1 font-medium">
              Avg 2.1h per session
            </p>
          </div>

          {/* Borrowed Books */}
          <div
            onClick={() => onNavigate('library_stats')}
            className="cursor-pointer p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all group active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Issued Books</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">{activeBooks.length}</span>
              <span className="text-xs text-gray-400">borrowed</span>
            </div>
            <p className="text-[11px] text-blue-400 mt-1 font-medium">
              No overdue fines
            </p>
          </div>

          {/* Discussion Room status */}
          <div
            onClick={() => onNavigate('discussion_rooms')}
            className="cursor-pointer p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all group active:scale-98"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Discussion Room</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-white">
                {approvedBooking ? '1' : '0'}
              </span>
              <span className="text-xs text-gray-400">active pass</span>
            </div>
            <p className={`text-[11px] font-medium mt-1 ${approvedBooking ? 'text-emerald-400' : 'text-gray-400'}`}>
              {approvedBooking ? 'Allotment approved' : 'Available to book'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Approved Discussion Room Pass Banner */}
      {approvedBooking && (
        <div className="p-4 rounded-2xl bg-[#17251e] border border-emerald-500/40 text-emerald-100 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Confirmed Allotment Pass
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {approvedBooking.roomName}
                </h4>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              APPROVED
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-200">
            <span>{approvedBooking.bookingDate} • {approvedBooking.timeSlot}</span>
            <button
              onClick={() => onNavigate('discussion_rooms')}
              className="font-bold text-emerald-400 underline hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View Pass</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Daily News Clipping Featured Card */}
      {latestNews && (
        <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] overflow-hidden shadow-md">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Newspaper className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Daily News Clipping Service
                </span>
              </div>
              <span className="text-[11px] text-gray-400">{latestNews.date}</span>
            </div>

            <h4 className="text-sm font-bold text-white leading-snug hover:text-red-300 transition-colors cursor-pointer" onClick={() => onNavigate('news_clippings')}>
              {latestNews.title}
            </h4>

            <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
              {latestNews.summary}
            </p>

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Source: {latestNews.sourceName}
              </span>
              <button
                onClick={() => onNavigate('news_clippings')}
                className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-all flex items-center space-x-1"
              >
                <span>Read & PDF</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currently Issued Books */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Currently Borrowed Books ({activeBooks.length})
          </h3>
          <button
            onClick={() => onNavigate('library_stats')}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-0.5"
          >
            <span>History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {activeBooks.map((book) => (
            <div
              key={book.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] flex items-center justify-between"
            >
              <div className="pr-2 flex-1">
                <h4 className="text-xs font-semibold text-white line-clamp-1">
                  {book.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {book.author}
                </p>
                <div className="mt-2 flex items-center space-x-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                    Due: {book.dueDate}
                  </span>
                  <span className="text-gray-500">
                    Renews: {book.renewalCount}/2
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRenew(book.id)}
                disabled={book.renewalCount >= 2}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                  book.renewalCount < 2
                    ? 'bg-[#8A151B] hover:bg-red-700 text-white active:scale-95 shadow-xs'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
                title="Extend loan by 14 days"
              >
                <RotateCw className="w-3 h-3" />
                <span>Renew</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Shortcuts Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Library Services
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNavigate('discussion_rooms')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            </div>
            <div>
              <div className="text-xs font-bold text-white">Book Room</div>
              <div className="text-[10px] text-gray-400">Group study slots</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('opac_catalog')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Koha OPAC</div>
              <div className="text-[10px] text-gray-400">Search shelf books</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('book_requisition')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
            </div>
            <div>
              <div className="text-xs font-bold text-white">Request Book</div>
              <div className="text-[10px] text-gray-400">Purchase requisition</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('timings')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            </div>
            <div>
              <div className="text-xs font-bold text-white">LIRC Hours</div>
              <div className="text-[10px] text-gray-400">Circulation timings</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('new_arrivals')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">New Arrivals</div>
              <div className="text-[10px] text-gray-400">Latest books added</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('lirc_resources')}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">All Resources</div>
              <div className="text-[10px] text-gray-400">e-Resources & Links</div>
            </div>
          </button>
        </div>
      </div>

      {/* New Arrivals Preview */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>New Arrivals Preview</span>
          </h3>
          <button
            onClick={() => onNavigate('new_arrivals')}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {NEW_ARRIVALS_BOOKS.slice(0, 3).map((book) => (
            <div
              key={book.id}
              className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C30] flex items-center justify-between"
            >
              <div className="pr-2 flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white line-clamp-1">
                  {book.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {book.author}
                </p>
                <div className="mt-1 flex items-center space-x-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 font-medium border border-pink-500/20">
                    {book.category}
                  </span>
                  <span className="text-gray-500">Shelf 48</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};