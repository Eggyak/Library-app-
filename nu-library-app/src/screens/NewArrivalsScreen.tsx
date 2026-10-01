import React from 'react';
import { BookOpen, Calendar, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import { NEW_ARRIVALS_BOOKS, NewArrivalBook } from '../data/newArrivalsData';
import { BookCover } from '../components/BookCover';

interface NewArrivalsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const NewArrivalsScreen: React.FC<NewArrivalsScreenProps> = ({ onNavigate }) => {
  const handleOpenKoha = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
        <span className="px-3 py-1 rounded-full bg-[#8A151B] text-white text-xs font-semibold">
          {NEW_ARRIVALS_BOOKS.length} Books
        </span>
      </div>

      {/* Books Grid */}
      <div className="space-y-3">
        {NEW_ARRIVALS_BOOKS.map((book: NewArrivalBook) => (
          <div
            key={book.id}
            className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-[#8A151B] transition-all space-y-3"
          >
            <div className="flex items-start space-x-3.5">
              <BookCover
                book={{
                  id: book.id,
                  biblionumber: book.biblionumber,
                  title: book.title,
                  author: book.author,
                  callNumber: book.callNumber,
                  stackLocation: book.shelfLocation,
                  category: book.category,
                  copiesAvailable: 2,
                  totalCopies: 3,
                  isbn: ''
                }}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#8A151B]/20 text-red-400 text-[10px] font-bold border border-red-500/20">
                    {book.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                    {book.year}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mt-1.5 leading-snug line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">by {book.author}</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{book.description}</p>

            <div className="pt-2 border-t border-[#2C2C30] space-y-2 text-[11px]">
              <div className="flex items-center space-x-2 text-gray-400">
                <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-mono text-white">{book.callNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{book.shelfLocation}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Biblionumber: {book.biblionumber}</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenKoha(book.kohaUrl)}
              className="w-full mt-2 px-3 py-2 rounded-xl bg-[#8A151B] hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View on Koha OPAC</span>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#2C2C30] p-3 rounded-2xl bg-[#121214] border-[#333338] text-[11px] text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300">New Arrivals Display</p>
        <p>Books are displayed at the New Arrivals section (Shelf 48) near the LIRC entrance for 30 days.</p>
        <p>Click "View on Koha OPAC" to check real-time availability, place holds, or see full bibliographic details.</p>
        <p className="pt-2 border-t border-[#2C2C30]">Data sourced from Koha ILMS • NIIT University LIRC</p>
      </div>
    </div>
  );
};