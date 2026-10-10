import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  MapPin,
  PlusCircle,
  X,
  Sparkles,
  Barcode,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  BookmarkCheck,
  Send
} from 'lucide-react';
import { Book, SearchResultItem } from '../types';
import { Api } from '../services/api';
import { BookCover } from '../components/BookCover';

interface OpacCatalogScreenProps {
  onNavigateToRequisition: () => void;
  initialQuery?: string;
}

const QUICK_TOPIC_PROMPTS = [
  { label: 'Operating Systems', query: 'operating systems' },
  { label: 'Algorithms & Data Structures', query: 'algorithms data structures' },
  { label: 'Database Systems', query: 'database sql normalization' },
  { label: 'Computer Networks', query: 'computer networks tcp' },
  { label: 'Machine Learning', query: 'machine learning deep learning' },
  { label: 'Software Engineering', query: 'software engineering architecture' }
];

export const OpacCatalogScreen: React.FC<OpacCatalogScreenProps> = ({
  onNavigateToRequisition,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories
  useEffect(() => {
    Api.getBookCategories()
      .then((cats) => {
        if (cats.data?.items && cats.data.items.length > 0) {
          setCategories(['All', ...cats.data.items.map(c => c.name)]);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      fetchBooks(query, selectedCategory);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, selectedCategory]);

  const fetchBooks = async (q: string, cat: string) => {
    setLoading(true);
    try {
      const res = await Api.searchBooks({
        query: q.trim(),
        category: cat === 'All' ? undefined : cat,
        pageSize: 50
      });
      setSearchResults(res.data?.items || []);
    } catch (err) {
      console.warn('Failed to search books:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshCatalog = () => {
      fetchBooks(query, selectedCategory);
      Api.getBookCategories().then(result => {
        if (result.data?.items) setCategories(['All', ...result.data.items.map(category => category.name)]);
      }).catch(() => {});
    };
    const refreshOnResume = () => { if (document.visibilityState === 'visible') refreshCatalog(); };
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') refreshCatalog(); }, 20000);
    window.addEventListener('lirc:realtime:books', refreshCatalog);
    document.addEventListener('visibilitychange', refreshOnResume);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('lirc:realtime:books', refreshCatalog);
      document.removeEventListener('visibilitychange', refreshOnResume);
    };
  }, [query, selectedCategory]);

  const handleInstantRequest = async (book: Book) => {
    try {
      const studentName = window.prompt('Full name (required)');
      if (!studentName) return;
      const enrollmentNo = window.prompt('Enrollment / Student ID (required)');
      if (!enrollmentNo) return;
      const studentEmail = window.prompt('University email (required)');
      if (!studentEmail) return;
      const studentPhone = window.prompt('Phone number (required)');
      if (!studentPhone) return;
      await Api.submitBookRequest({
        title: book.title,
        author: book.author,
        isbn: book.isbn || undefined,
        publisher: book.publisher || undefined,
        edition: String(book.publicationYear || ''),
        reason: 'Requested copy via Koha OPAC search',
        studentName,
        enrollmentNo,
        studentEmail,
        studentPhone,
        catalogBookId: book.id
      });
      setRequestSuccess(`Requisition request submitted for "${book.title}"`);
      setTimeout(() => setRequestSuccess(null), 4000);
    } catch (err: any) {
      alert(`Could not request book: ${err.message || 'Error'}`);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-28">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#23112a] to-[#1C1C1E] border border-purple-500/40 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-300">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              LIRC Smart Catalog Search
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            LIVE LIBRARY API
          </span>
        </div>
        <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
          Search textbooks, monographs, and references across all LIRC racks. Check live copy availability and shelf locations.
        </p>
      </div>

      {requestSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Multi-Intent Unified Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search book title, author, topic or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1C1C1E] border border-gray-800 rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 shadow-inner"
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

        <div className="flex items-center justify-between px-1 text-[11px] text-gray-400">
          <span>{searchResults.length} {searchResults.length === 1 ? 'book found' : 'books found'}</span>
          <button
            onClick={onNavigateToRequisition}
            className="text-pink-400 hover:text-pink-300 underline font-medium"
          >
            Can't find a book? Request acquisition
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 font-medium px-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Topics:</span>
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
        {categories.map((cat) => (
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

      {/* Books List */}
      <div className="space-y-3">
        {loading && searchResults.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Searching LIRC collection...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs space-y-2">
            <HelpCircle className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="font-semibold text-gray-300">No books found matching your criteria</p>
            <p className="text-[11px] text-gray-500">
              Try searching by title, author, keyword, or propose a new purchase.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToRequisition}
                className="px-4 py-2 rounded-xl bg-[#8A151B] text-white font-bold text-xs"
              >
                Submit Requisition
              </button>
            </div>
          </div>
        ) : (
          searchResults.map((book) => {
            const copiesAvail = book.quantityAvailable ?? 1;
            const totalCopies = book.quantityTotal ?? 1;
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="cursor-pointer p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] hover:border-purple-500/60 transition-all space-y-2.5 active:scale-[0.99] group shadow-sm hover:shadow-purple-950/20"
              >
                <div className="flex items-start space-x-3.5">
                  <BookCover book={book} size="md" className="group-hover:scale-102 transition-transform shadow-md" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/20">
                        {book.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                          copiesAvail > 0
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {copiesAvail > 0 ? `${copiesAvail}/${totalCopies} Available` : 'All Issued'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {book.title}
                    </h3>

                    <p className="text-xs text-gray-400">
                      By {book.author} {book.publicationYear ? `(${book.publicationYear})` : ''}
                    </p>

                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 pt-0.5 flex-wrap">
                      <div className="flex items-center space-x-1 text-amber-300/90">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{book.shelfLocation || 'Main Stack'}</span>
                      </div>
                      {book.isbn && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="font-mono text-gray-400">ISBN: {book.isbn}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181B] border border-gray-700 rounded-3xl p-5 w-full max-w-sm text-left text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                    <span className="text-gray-300">{selectedBook.publisher} {selectedBook.publicationYear ? `(${selectedBook.publicationYear})` : ''}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block text-[10px]">LOCATION</span>
                  <span className="text-amber-300 font-medium">{selectedBook.shelfLocation || 'Main Stack'}</span>
                </div>
                {selectedBook.isbn && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">ISBN</span>
                    <span className="font-mono text-gray-300">{selectedBook.isbn}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121214] border border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-400">Live Availability:</span>
              <span className="font-bold text-emerald-400">
                {(selectedBook.quantityAvailable ?? 1)} / {(selectedBook.quantityTotal ?? 1)} Available
              </span>
            </div>

            {selectedBook.description && (
              <div className="bg-[#121214] p-3 rounded-xl border border-gray-800 text-xs text-gray-300 leading-relaxed">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Description:
                </span>
                {selectedBook.description}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  handleInstantRequest(selectedBook);
                  setSelectedBook(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#8A151B] hover:bg-red-700 text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request Acquisition / Reserve</span>
              </button>

              <button
                onClick={() => setSelectedBook(null)}
                className="w-full py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
