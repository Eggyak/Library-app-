import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, MapPin, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Book } from '../types';
import { Api } from '../services/api';
import { BookCover } from '../components/BookCover';

interface NewArrivalsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const NewArrivalsScreen: React.FC<NewArrivalsScreenProps> = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNewArrivals = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await Api.getNewArrivals({ pageSize: 30 });
      setBooks(res.data?.items || []);
    } catch (err) {
      console.warn('Failed to load new arrivals:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadNewArrivals();
    const handleUpdate = () => loadNewArrivals(false);
    const handleResume = () => { if (document.visibilityState === 'visible') loadNewArrivals(false); };
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') loadNewArrivals(false); }, 20000);
    window.addEventListener('lirc:realtime:books', handleUpdate);
    window.addEventListener('lirc:realtime:new_arrivals', handleUpdate);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('lirc:realtime:books', handleUpdate);
      window.removeEventListener('lirc:realtime:new_arrivals', handleUpdate);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  return (
    <div className="p-4 space-y-5 animate-fade-in text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">New Arrivals</h2>
            <p className="text-xs text-gray-400">Latest additions to LIRC collection</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-[#8A151B] text-white text-xs font-semibold">
            {books.length} Books
          </span>
          <button
            onClick={() => loadNewArrivals()}
            disabled={loading}
            className="p-1.5 rounded-xl bg-[#1C1C1E] border border-gray-700 text-gray-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="space-y-3">
        {loading && books.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1C1C1E] text-gray-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-400" />
            <p>Loading latest library acquisitions...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#1C1C1E] text-gray-400 text-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p>No catalog acquisitions recorded yet.</p>
          </div>
        ) : (
          books.map((book) => {
            const avail = book.quantityAvailable ?? 1;
            const total = book.quantityTotal ?? 1;
            return (
              <div
                key={book.id}
                className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all space-y-3"
              >
                <div className="flex items-start space-x-3.5">
                  <BookCover book={book} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#8A151B]/20 text-red-400 text-[10px] font-bold border border-red-500/20">
                        {book.category}
                      </span>
                      {book.publicationYear && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                          {book.publicationYear}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                        {avail}/{total} Available
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1.5 leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">by {book.author}</p>
                  </div>
                </div>

                {book.description && (
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {book.description}
                  </p>
                )}

                <div className="pt-2 border-t border-[#2C2C30] flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{book.shelfLocation || 'Shelf 48 (New Arrivals)'}</span>
                  </div>
                  {book.isbn && (
                    <span className="font-mono text-gray-400 text-[10px]">
                      ISBN: {book.isbn}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#2C2C30] p-3 rounded-2xl bg-[#121214] border-[#333338] text-[11px] text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300">New Arrivals Display</p>
        <p>Books are displayed at the New Arrivals section (Shelf 48) near the LIRC entrance for 30 days.</p>
        <p className="pt-2 border-t border-[#2C2C30]">Data synced in real time with NIIT University LIRC Server</p>
      </div>
    </div>
  );
};
