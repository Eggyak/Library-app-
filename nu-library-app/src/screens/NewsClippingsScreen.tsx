import React, { useState } from 'react';
import {
  Newspaper,
  Calendar,
  Download,
  FileText,
  Search,
  ExternalLink,
  Tag,
  Share2,
  Bookmark,
  CheckCircle,
  X,
  Eye,
  Plus
} from 'lucide-react';
import { NewsClipping, UserProfile } from '../types';

interface NewsClippingsScreenProps {
  news: NewsClipping[];
  currentUser: UserProfile | null;
  onNavigateToPublish?: () => void;
}

const CATEGORIES = ['All', 'NU in News', 'Higher Education', 'Science & Tech', 'National', 'Editorial'];

export const NewsClippingsScreen: React.FC<NewsClippingsScreenProps> = ({
  news,
  currentUser,
  onNavigateToPublish
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePdfClip, setActivePdfClip] = useState<NewsClipping | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSimulateDownload = (clip: NewsClipping) => {
    setDownloadSuccess(`Downloaded: ${clip.pdfFileName || clip.title + '.pdf'}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/80 to-[#1C1C1E] border border-blue-600/40 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5 text-blue-300">
            <Newspaper className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">
              Daily News Clipping Service
            </h2>
          </div>
          {currentUser?.role === 'admin' && onNavigateToPublish && (
            <button
              onClick={onNavigateToPublish}
              className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish News</span>
            </button>
          )}
        </div>
        <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
          Curated higher education news, national technology breakthroughs, and NIIT University press coverages directly in-app.
        </p>
      </div>

      {/* Download toast notification */}
      {downloadSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search headlines, keywords, or newspapers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1C1C1E] border border-gray-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
        />
      </div>

      {/* Category Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs">
            No news clippings found matching your search.
          </div>
        ) : (
          filteredNews.map((clip) => {
            const isSaved = savedIds.includes(clip.id);

            return (
              <div
                key={clip.id}
                className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] overflow-hidden hover:border-gray-600 transition-all p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        {clip.category}
                      </span>
                      {clip.isFeatured && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          Top Story
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug pt-1">
                      {clip.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleSave(clip.id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isSaved ? 'text-amber-400' : 'text-gray-500 hover:text-white'
                    }`}
                    title="Bookmark clipping"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span>{clip.date}</span>
                  </div>
                  <span>•</span>
                  <span>{clip.sourceName}</span>
                </div>

                {/* Summary */}
                <p className="text-xs text-gray-300 leading-relaxed">
                  {clip.summary}
                </p>

                {/* Key Points Bullet List */}
                {clip.keyPoints && clip.keyPoints.length > 0 && (
                  <div className="bg-[#121214] p-3 rounded-xl border border-gray-800 space-y-1 text-xs text-gray-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Key Takeaways:
                    </span>
                    {clip.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5 font-bold">•</span>
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* PDF Attachment Action Box (replaces email PDF workflow) */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span className="truncate max-w-[140px] text-gray-300">
                      {clip.pdfFileName || 'Daily_Press_Clip.pdf'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      ({clip.pdfSize || '1.2 MB'})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setActivePdfClip(clip)}
                      className="px-2.5 py-1 rounded-lg bg-[#242428] hover:bg-[#303036] text-gray-200 text-xs font-medium flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>View PDF</span>
                    </button>

                    <button
                      onClick={() => handleSimulateDownload(clip)}
                      className="p-1 rounded-lg bg-[#242428] hover:bg-[#303036] text-gray-200 text-xs font-medium hover:text-white"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Document / Simulated PDF Viewer Modal */}
      {activePdfClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#18181B] border border-gray-700 rounded-3xl w-full max-w-lg text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#121214]">
              <div className="flex items-center space-x-2 text-red-400">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-xs font-bold text-white truncate max-w-[240px]">
                    {activePdfClip.pdfFileName || activePdfClip.title}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {activePdfClip.sourceName} • {activePdfClip.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSimulateDownload(activePdfClip)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setActivePdfClip(null)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content simulated in high fidelity */}
            <div className="flex-1 overflow-y-auto p-6 bg-white text-gray-900 space-y-4 font-serif leading-relaxed select-text">
              <div className="border-b-2 border-black pb-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-sans font-bold uppercase tracking-widest text-red-800">
                    LIRC NIIT UNIVERSITY • DAILY PRESS CLIPPING
                  </span>
                  <span className="text-xs font-sans text-gray-600">
                    {activePdfClip.date}
                  </span>
                </div>
                <h1 className="text-xl font-bold font-serif text-black mt-2 leading-snug">
                  {activePdfClip.title}
                </h1>
                <div className="text-xs font-sans text-gray-500 mt-1">
                  Published in: {activePdfClip.sourceName} | Section: {activePdfClip.category}
                </div>
              </div>

              <p className="text-sm text-gray-800 leading-relaxed text-justify first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-[#8A151B]">
                {activePdfClip.summary}
              </p>

              {activePdfClip.keyPoints && (
                <div className="bg-gray-100 p-4 rounded-xl border-l-4 border-[#8A151B] my-4 font-sans text-xs text-gray-700 space-y-2">
                  <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                    Official Press Highlights & Analysis
                  </div>
                  {activePdfClip.keyPoints.map((kp, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-[#8A151B] font-bold">■</span>
                      <span>{kp}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-gray-300 text-center font-sans text-[11px] text-gray-500">
                Learning & Information Resource Centre (LIRC) • NIIT University, Neemrana (Rajasthan) - 301705
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};