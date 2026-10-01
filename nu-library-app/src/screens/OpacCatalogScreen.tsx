import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  MapPin,
  ExternalLink,
  PlusCircle,
  X,
  Sparkles,
  Barcode,
  Layers,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  BookmarkCheck
} from 'lucide-react';
import { Book, SearchResultItem, SearchIntentType } from '../types';
import { OpacService } from '../services/opacService';
import { BookCover } from '../components/BookCover';

interface OpacCatalogScreenProps {
  onNavigateToRequisition: () => void;
  initialQuery?: string;
}

const CATEGORIES = ['All', 'Computer Science', 'Indian Knowledge System', 'Entrepreneurship', 'Electronics'];

const QUICK_TOPIC_PROMPTS = [
  { label: 'Deadlocks', query: 'I am unable to understand deadlocks in operating systems' },
  { label: 'Dynamic Programming', query: 'how does dynamic programming work in algorithms' },
  { label: 'Backpropagation', query: 'I don\'t understand backpropagation in neural networks' },
  { label: 'TCP Handshake', query: 'TCP 3-way handshake and connection teardown' },
  { label: 'Normalization (3NF/BCNF)', query: 'how to normalize database to 3NF and BCNF' },
  { label: 'Fourier Transform', query: 'Fourier transform and frequency response' },
  { label: 'Docker & Kubernetes', query: 'Docker containerization and kubernetes' },
  { label: 'Vedic Math & IKS', query: 'ancient Indian mathematics and Aryabhata' },
  { label: 'ISBN: 9780134610993', query: '9780134610993' }
];

const KOHA_BASE_URL = 'https://library.niituniversity.in/cgi-bin/koha/';

const KOHA_LINKS = [
  { label: 'Koha library home', href: `${KOHA_BASE_URL}opac-main.pl` },
  { label: 'Advanced search', href: `${KOHA_BASE_URL}opac-search.pl` },
  { label: 'Course reserves', href: `${KOHA_BASE_URL}opac-course-reserves.pl` },
  { label: 'Browse by hierarchy (not configured)', href: `${KOHA_BASE_URL}opac-browser.pl` },
  { label: 'Authority search', href: `${KOHA_BASE_URL}opac-authorities-home.pl` },
  { label: 'Most popular', href: `${KOHA_BASE_URL}opac-topissues.pl` },
  { label: 'My library account', href: `${KOHA_BASE_URL}opac-user.pl` },
  { label: 'Library contact', href: `${KOHA_BASE_URL}opac-library.pl` },
  { label: 'Repositories', href: `${KOHA_BASE_URL}opac-page.pl?page_id=11` },
  { label: 'Collection', href: `${KOHA_BASE_URL}opac-page.pl?page_id=15` },
  { label: 'Reports', href: `${KOHA_BASE_URL}opac-page.pl?page_id=13` },
  { label: 'E-resources', href: `${KOHA_BASE_URL}opac-page.pl?page_id=14` },
  { label: 'Gallery', href: `${KOHA_BASE_URL}opac-page.pl?page_id=19` },
  { label: 'Testimonials', href: `${KOHA_BASE_URL}opac-page.pl?page_id=17` },
  { label: 'Contact us', href: `${KOHA_BASE_URL}opac-page.pl?page_id=18` }
];

export const OpacCatalogScreen: React.FC<OpacCatalogScreenProps> = ({
  onNavigateToRequisition,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<SearchIntentType>('general');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    handleSearch(query);
  }, [query]);

  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    const res = await OpacService.search(searchTerm);
    setSearchResults(res.results);
    setIsLive(res.isLive);
    setDetectedIntent(res.detectedIntent);
    setLoading(false);
  };

  const filteredResults = searchResults.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.book.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const getIntentBadge = () => {
    if (!query.trim()) return null;

    if (detectedIntent === 'isbn') {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
          <Barcode className="w-3.5 h-3.5" />
          <span>ISBN Direct Match Found</span>
        </div>
      );
    }
    if (detectedIntent === 'topic') {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-semibold animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Topic Recommendation Model Active</span>
        </div>
      );
    }
    if (detectedIntent === 'title') {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Catalog Book Title Match</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-28">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#23112a] to-[#1C1C1E] border border-purple-500/40 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-300">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              LIRC Smart Catalog & Topic AI
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            isLive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          }`}>
            {isLive ? 'LIVE KOHA OPAC' : 'OFFLINE AI CATALOG'}
          </span>
        </div>
        <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
          Stuck on a concept? Enter a topic you find difficult (e.g. <i>"I don't understand deadlocks"</i>), a book title, or an ISBN to find the exact books and chapters you need.
        </p>
      </div>

      {/* Multi-Intent Unified Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Enter topic to learn, book name, or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-gray-800 rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-purple-500 shadow-inner"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : loading ? (
            <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          ) : null}
        </div>

        <a
          href={`${KOHA_BASE_URL}opac-search.pl${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs font-medium text-red-300 hover:text-red-200 underline underline-offset-4"
        >
          Search full Koha catalogue
        </a>

        {/* Intent Status Badge */}
        {getIntentBadge() && (
          <div className="flex items-center justify-between px-1">
            {getIntentBadge()}
            <span className="text-[10px] text-gray-400">
              {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        )}
      </div>

      <details className="group border-y border-[#333338] py-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-white flex items-center justify-between">
          Koha online services
          <span className="text-xs font-normal text-gray-400 group-open:hidden">Show</span>
          <span className="hidden text-xs font-normal text-gray-400 group-open:inline">Hide</span>
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {KOHA_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="py-1 text-xs text-gray-300 hover:text-white underline-offset-2 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-500">Account functions open on Koha and may require your library login.</p>
      </details>

      {/* Quick Prompts for Struggling Students */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 font-medium px-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Topic Prompts:</span>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          {QUICK_TOPIC_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              onClick={() => setQuery(prompt.query)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap border transition-all active:scale-95 ${
                query === prompt.query
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                  : 'bg-[#18181A] text-gray-300 hover:text-white border-gray-800 hover:border-purple-500/40'
              }`}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Missing book helper callout */}
      <div className="p-3 rounded-2xl bg-[#1C1C1E] border border-gray-800 flex items-center justify-between text-xs">
        <div className="text-gray-300">
          Book missing or checked out?
        </div>
        <button
          onClick={onNavigateToRequisition}
          className="px-3 py-1 rounded-xl bg-pink-600/30 border border-pink-500/40 text-pink-300 font-semibold hover:bg-pink-600/40 transition-all flex items-center space-x-1"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Requisition</span>
        </button>
      </div>

      {/* Books List with Covers & Topic Recommendations */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs space-y-2">
            <HelpCircle className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="font-semibold text-gray-300">No books found for "{query}"</p>
            <p className="text-[11px] text-gray-500">
              Try searching by topic (e.g. "Deadlocks", "Backpropagation"), book title ("CLRS"), or ISBN (9780134610993).
            </p>
          </div>
        ) : (
          filteredResults.map(({ book, matchType, recommendationReason, relevantChapter, matchedTerms }) => (
            <div
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="cursor-pointer p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-purple-500/60 transition-all space-y-2.5 active:scale-[0.99] group shadow-sm hover:shadow-purple-950/20"
            >
              <div className="flex items-start space-x-3.5">
                {/* Book Cover Image with Fallback Jacket */}
                <BookCover book={book} size="md" className="group-hover:scale-102 transition-transform shadow-md" />

                {/* Book Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/20">
                      {book.callNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 bg-gray-500/15 text-gray-300 border-gray-500/30">
                      {book.totalCopies} cataloged
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {book.title}
                  </h3>

                  <p className="text-xs text-gray-400">
                    By {book.author} {book.year ? `(${book.year})` : ''}
                  </p>

                  {/* Shelf Location & ISBN */}
                  <div className="flex items-center space-x-2 text-[10px] text-gray-400 pt-0.5 flex-wrap">
                    <div className="flex items-center space-x-1 text-amber-300/90">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{book.stackLocation}</span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="font-mono text-gray-400">ISBN: {book.isbn}</span>
                  </div>
                </div>
              </div>

              {/* Topic Recommendation Box if this book was recommended for a student's topic */}
              {query.trim() && recommendationReason && (
                <div className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200/90 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-purple-300 text-[11px]">
                    <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
                    <span>Why This Book:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-purple-100">
                    {recommendationReason}
                  </p>
                  {relevantChapter && (
                    <div className="text-[10px] font-medium text-emerald-300 flex items-center space-x-1 pt-0.5">
                      <BookmarkCheck className="w-3 h-3 shrink-0" />
                      <span>{relevantChapter}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Matched / Covered Topic Pills */}
              {book.topics && book.topics.length > 0 && (
                <div className="flex items-center space-x-1 overflow-x-auto pt-1 scrollbar-none">
                  {book.topics.slice(0, 4).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#242428] text-gray-300 text-[9px] font-medium whitespace-nowrap border border-gray-700/50"
                    >
                      {t}
                    </span>
                  ))}
                  {book.topics.length > 4 && (
                    <span className="text-[9px] text-gray-500 font-mono">
                      +{book.topics.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#18181B] border border-gray-700 rounded-3xl p-5 w-full max-w-sm text-left text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-2 border-b border-gray-800">
              <div className="pr-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  {selectedBook.category}
                </span>
                <h3 className="font-bold text-base text-white mt-0.5 leading-snug">
                  {selectedBook.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Book Cover + Meta row */}
            <div className="flex space-x-4 items-center">
              <BookCover book={selectedBook} size="lg" className="shadow-xl" />
              <div className="space-y-1.5 text-xs text-gray-300 flex-1 min-w-0">
                <div>
                  <span className="text-gray-500 block text-[10px]">AUTHOR</span>
                  <span className="text-white font-medium">{selectedBook.author}</span>
                </div>
                {selectedBook.publisher && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">PUBLISHER</span>
                    <span className="text-gray-300">{selectedBook.publisher} ({selectedBook.year})</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-[10px]">CALL NUMBER</span>
                  <span className="font-mono text-purple-300">{selectedBook.callNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">LOCATION</span>
                  <span className="text-amber-300 font-medium">{selectedBook.stackLocation}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">ISBN</span>
                  <span className="font-mono text-gray-300">{selectedBook.isbn}</span>
                </div>
              </div>
            </div>

            {/* Inventory count; the workbook does not include live loan status. */}
            <div className="p-2.5 rounded-xl bg-[#121214] border border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-400">Inventory:</span>
              <span className="font-semibold text-gray-300">
                {selectedBook.totalCopies} copies listed; live checkout status unavailable
              </span>
            </div>

            {/* Description Overview */}
            {selectedBook.description && (
              <div className="bg-[#121214] p-3 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Book Overview:
                </span>
                {selectedBook.description}
              </div>
            )}

            {/* Recommended Chapters Breakdown */}
            {selectedBook.recommendedChapters && selectedBook.recommendedChapters.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                  Recommended Chapters for Learning:
                </span>
                <div className="space-y-1.5">
                  {selectedBook.recommendedChapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#141416] border border-gray-800 text-xs text-gray-300 space-y-1"
                    >
                      <div className="flex items-center space-x-1.5 font-semibold text-white">
                        <BookmarkCheck className="w-3.5 h-3.5 text-pink-400" />
                        <span>{ch.chapter}: {ch.title}</span>
                      </div>
                      {ch.topics && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {ch.topics.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 text-[10px] border border-purple-500/20"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Covered Topics Tags */}
            {selectedBook.topics && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  All Topics Covered:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedBook.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-300 text-[10px] border border-gray-700/50"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Shelf Locator Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  alert(`Shelf Locator: Head to ${selectedBook.stackLocation}, Call No. ${selectedBook.callNumber}`);
                  setSelectedBook(null);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all active:scale-98 shadow-md"
              >
                Locate On Shelf
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};