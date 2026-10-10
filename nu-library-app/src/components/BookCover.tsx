import React, { useState } from 'react';
import { Book as BookIcon, Cpu, Database, Network, Code, Sparkles, Binary } from 'lucide-react';
import { Book } from '../types';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Computer Science': {
    bg: 'from-purple-900 via-indigo-900 to-slate-900',
    text: 'text-purple-300',
    border: 'border-purple-500/30'
  },
  'Artificial Intelligence': {
    bg: 'from-fuchsia-950 via-purple-900 to-slate-900',
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-500/30'
  },
  'Electronics': {
    bg: 'from-cyan-950 via-teal-900 to-slate-900',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30'
  },
  'Entrepreneurship': {
    bg: 'from-amber-950 via-orange-950 to-slate-900',
    text: 'text-amber-300',
    border: 'border-amber-500/30'
  },
  'Indian Knowledge System': {
    bg: 'from-emerald-950 via-teal-950 to-slate-900',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30'
  }
};

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const category = book.category || 'General';
  const style = CATEGORY_STYLES[category] || {
    bg: 'from-[#3A070B] via-[#240A0D] to-black',
    text: 'text-red-300',
    border: 'border-red-500/30'
  };

  const dimensions = {
    sm: 'w-12 h-16 min-w-12 min-h-16 text-[9px]',
    md: 'w-18 h-24 min-w-18 min-h-24 text-[10px]',
    lg: 'w-28 h-38 min-w-28 min-h-38 text-xs'
  }[size];

  // Try Open Library cover or specified coverUrl
  const coverUrl = !imageError && (book.coverUrl || (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn.replace(/[^0-9X]/gi, '')}-M.jpg` : null));

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-lg border shrink-0 select-none flex flex-col justify-between transition-transform duration-200 ${dimensions} ${style.border} ${className}`}
    >
      {/* Real Image Layer */}
      {coverUrl && !imageError && (
        <img
          src={coverUrl}
          alt={book.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Styled Book Jacket Fallback (shown when offline, loading, or image missing) */}
      {(!coverUrl || imageError || !imageLoaded) && (
        <div
          className={`absolute inset-0 bg-gradient-to-b ${style.bg} p-1.5 flex flex-col justify-between leading-tight`}
        >
          {/* Subtle Book Spine Highlight */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/10 border-r border-black/30" />

          {/* Top header badge */}
          <div className="pl-2 pt-0.5">
            <span className="text-[7px] uppercase font-bold tracking-wider opacity-75 truncate block text-gray-300">
              {category.split(' ')[0]}
            </span>
          </div>

          {/* Book Title */}
          <div className="pl-2 pr-0.5 my-auto">
            <p className="font-bold text-white leading-tight line-clamp-3 drop-shadow-xs">
              {book.title}
            </p>
          </div>

          {/* Author & Shelf footer */}
          <div className="pl-2 pb-0.5 pt-1 border-t border-white/10 flex items-center justify-between text-[7px] text-gray-300">
            <span className="truncate opacity-80">{book.author.split(' ')[0]}</span>
            <span className="font-mono text-[6px] opacity-60 shrink-0">{book.shelfLocation || 'Main Stack'}</span>
          </div>
        </div>
      )}

      {/* Spine 3D Shadow Overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
    </div>
  );
};