import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CreditCard,
  Radio,
  Newspaper,
  Calendar,
  BookOpen,
  PlusCircle,
  Clock,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, DiscussionRoomBooking, NewsClipping, Book } from '../types';
import { Api } from '../services/api';
import { EngagementTracker, trackEngagement } from '../components/EngagementTracker';
import { DynamicUpdatesStack } from '../components/DynamicUpdatesStack';

interface StudentDashboardProps {
  user: UserProfile;
  nfcSupported: boolean;
  nfcCardEnabled: boolean;
  onNavigate: (screen: any, query?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  nfcSupported,
  nfcCardEnabled,
  onNavigate
}) => {
  const [dashSearchInput, setDashSearchInput] = useState('');
  const [showVirtualId, setShowVirtualId] = useState(false);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [myBookings, setMyBookings] = useState<DiscussionRoomBooking[]>([]);
  const [latestNews, setLatestNews] = useState<NewsClipping | null>(null);

  const loadDashboardData = async () => {
    try {
      const [booksRes, bookingsRes, newsRes] = await Promise.all([
        Api.getNewArrivals({ pageSize: 3 }),
        Api.getMyRoomRequests(),
        Api.getClippings({ pageSize: 1 })
      ]);
      setNewArrivals(booksRes.data?.items || []);
      setMyBookings(bookingsRes.data?.items || []);
      if (newsRes.data?.items && newsRes.data.items.length > 0) {
        setLatestNews(newsRes.data.items[0]);
      }
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleUpdate = () => {
      loadDashboardData();
      window.dispatchEvent(new CustomEvent('lirc:engagement:refresh'));
    };
    window.addEventListener('lirc:realtime:books', handleUpdate);
    window.addEventListener('lirc:realtime:new_arrivals', handleUpdate);
    window.addEventListener('lirc:realtime:discussion_rooms', handleUpdate);
    window.addEventListener('lirc:realtime:clippings', handleUpdate);
    return () => {
      window.removeEventListener('lirc:realtime:books', handleUpdate);
      window.removeEventListener('lirc:realtime:new_arrivals', handleUpdate);
      window.removeEventListener('lirc:realtime:discussion_rooms', handleUpdate);
      window.removeEventListener('lirc:realtime:clippings', handleUpdate);
    };
  }, []);

  const approvedBooking = myBookings.find(b => b.status === 'approved');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEngagement('catalog_search', dashSearchInput.trim() || 'empty search', <Search className="w-3.5 h-3.5 text-purple-400" />);
    onNavigate('opac_catalog', dashSearchInput.trim());
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* SECTION 1: Welcome Header */}
      <section aria-label="Welcome" className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8A151B] to-[#5C0E12] p-5 shadow-xl border border-red-900/50">
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
              {user.enrollmentNo} • {user.programCode || 'Student'}
            </p>
          </div>
        </div>

        {/* Virtual Student ID (still visible here for user info, just simplified) */}
        {user.role === 'guest' && nfcSupported && nfcCardEnabled && (
          <button
            type="button"
            onClick={() => setShowVirtualId((visible) => !visible)}
            className="mt-3 w-full flex items-center justify-between p-3 rounded-xl bg-[#202326] border border-emerald-700/60 text-left hover:border-emerald-500 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300">
                <CreditCard className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-white">Virtual Student ID</span>
                <span className="block text-[10px] text-gray-400">Tap to toggle</span>
              </span>
            </span>
            <Radio className={`w-4 h-4 text-emerald-300 transition-transform ${showVirtualId ? 'rotate-180' : ''}`} />
          </button>
        )}

        {showVirtualId && (
          <div className="mt-3 relative overflow-hidden rounded-xl border border-emerald-700/60 bg-gradient-to-br from-[#173b32] via-[#172a2a] to-[#262326] p-4 shadow-lg">
            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">NIIT University · LIRC</p>
                <h3 className="mt-2 text-sm font-bold text-white">{user.name}</h3>
                <p className="mt-0.5 text-[11px] text-emerald-100/75">{user.enrollmentNo}</p>
              </div>
              <CreditCard className="w-6 h-6 text-emerald-200" />
            </div>
          </div>
        )}
      </section>

      {/* Active Approved Room Pass Banner - shown when applicable */}
      {approvedBooking && (
        <div className="p-4 rounded-2xl bg-[#17251e] border border-emerald-500/40 text-emerald-100 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Confirmed Room Allotment Pass
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {approvedBooking.roomName || 'Discussion Room'}
                </h4>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              APPROVED
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-200">
            <span>{approvedBooking.date} • {approvedBooking.startTime} - {approvedBooking.endTime}</span>
            <button
              onClick={() => onNavigate('discussion_rooms')}
              className="font-bold text-emerald-400 underline hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View Request</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: Koha OPAC Search */}
      <section aria-label="Catalog Search" className="p-3.5 rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#1C1C1E] to-[#1C1C1E] border border-purple-500/40 shadow-xl space-y-2.5">
        <h3 className="text-sm font-semibold text-white">LIRC Catalog Search</h3>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Type book title, topic (e.g. Algorithms), or ISBN..."
            value={dashSearchInput}
            onChange={(e) => setDashSearchInput(e.target.value)}
            className="w-full bg-[#141416] border border-gray-700/80 rounded-2xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all active:scale-95"
            title="Search"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* SECTION 3: Engagement Tracker */}
      <section aria-label="Activity Tracker" className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-3">
        <EngagementTracker user={user} />
      </section>

      {/* SECTION 4: Dynamic Updates Stack (conditional) */}
      <section aria-label="Library Updates" className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30]">
        <DynamicUpdatesStack />
      </section>

      {/* Quick Access Shortcuts Grid */}
      <section aria-label="Quick Links">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              trackEngagement('nav_discussion_rooms', 'Booked discussion room', <Calendar className="w-3.5 h-3.5 text-amber-400" />);
              onNavigate('discussion_rooms');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Book Room</div>
              <div className="text-[10px] text-gray-400">Group study slots</div>
            </div>
          </button>

          <button
            onClick={() => {
              trackEngagement('nav_opac', 'Searched catalog', <Search className="w-3.5 h-3.5 text-purple-400" />);
              onNavigate('opac_catalog');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Book Catalog</div>
              <div className="text-[10px] text-gray-400">Search shelf books</div>
            </div>
          </button>

          <button
            onClick={() => {
              trackEngagement('nav_book_requisition', 'Opened book requisition', <BookOpen className="w-3.5 h-3.5 text-pink-400" />);
              onNavigate('book_requisition');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Request Book</div>
              <div className="text-[10px] text-gray-400">Purchase requisition</div>
            </div>
          </button>

          <button
            onClick={() => {
              trackEngagement('nav_timings', 'Viewed timetable', <Clock className="w-3.5 h-3.5 text-teal-400" />);
              onNavigate('timings');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">LIRC Hours</div>
              <div className="text-[10px] text-gray-400">Circulation timings</div>
            </div>
          </button>

          <button
            onClick={() => {
              trackEngagement('nav_resources', 'Browsed e-resources', <Globe className="w-3.5 h-3.5 text-emerald-400" />);
              onNavigate('lirc_resources');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">e-Resources</div>
              <div className="text-[10px] text-gray-400">Databases & links</div>
            </div>
          </button>

          <button
            onClick={() => {
              trackEngagement('nav_news', 'Read news clipping', <Newspaper className="w-3.5 h-3.5 text-blue-400" />);
              onNavigate('news_clippings');
            }}
            className="p-3 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:bg-[#242428] text-left flex items-center space-x-3 transition-all"
          >
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">News Clips</div>
              <div className="text-[10px] text-gray-400">Daily news</div>
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 5: Newspaper Clippings */}
      {latestNews && (
        <section aria-label="Daily News Clipping" className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] overflow-hidden shadow-md">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Newspaper className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Daily News Clipping
                </span>
              </div>
              <span className="text-[11px] text-gray-400">{latestNews.date}</span>
            </div>

            <h4
              className="text-sm font-bold text-white leading-snug hover:text-red-300 transition-colors cursor-pointer"
              onClick={() => onNavigate('news_clippings')}
            >
              {latestNews.title}
            </h4>

            {latestNews.notes && (
              <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                {latestNews.notes}
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Source: {latestNews.newspaperName || 'University Press'}
              </span>
              <button
                onClick={() => onNavigate('news_clippings')}
                className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-all flex items-center space-x-1"
              >
                <span>Read Clip</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: New Arrivals */}
      {newArrivals.length > 0 && (
        <section aria-label="New Arrivals" className="space-y-2.5">
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
            {newArrivals.map((book) => (
              <div
                key={book.id}
                onClick={() => onNavigate('opac_catalog', book.title)}
                className="cursor-pointer p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-gray-600 flex items-center justify-between transition-all"
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
                    <span className="text-gray-400">
                      {book.shelfLocation || 'Shelf 48'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
