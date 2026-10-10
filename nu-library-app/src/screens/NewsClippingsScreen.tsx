import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Calendar,
  Download,
  FileText,
  Search,
  ExternalLink,
  Tag,
  Bookmark,
  CheckCircle,
  X,
  Eye,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { NewsClipping, UserProfile } from '../types';
import { Api, fetchAssetObjectUrl } from '../services/api';

interface NewsClippingsScreenProps {
  news?: NewsClipping[];
  currentUser?: UserProfile | null;
  onNavigateToPublish?: () => void;
}

export const NewsClippingsScreen: React.FC<NewsClippingsScreenProps> = ({
  currentUser,
  onNavigateToPublish
}) => {
  const [clippings, setClippings] = useState<NewsClipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [previewClip, setPreviewClip] = useState<NewsClipping | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [zoom, setZoom] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');

  const loadClippings = async () => {
    setLoading(true);
    try {
      const res = await Api.getClippings({ pageSize: 50, date: filterDate });
      setClippings(res.data?.items || []);
    } catch (err) {
      console.warn('Failed to load clippings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClippings();
    const handleUpdate = () => loadClippings();
    window.addEventListener('lirc:realtime:clippings', handleUpdate);
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') loadClippings(); }, 20000);
    const resume = () => { if (document.visibilityState === 'visible') loadClippings(); };
    document.addEventListener('visibilitychange', resume);
    return () => { window.removeEventListener('lirc:realtime:clippings', handleUpdate); window.clearInterval(poll); document.removeEventListener('visibilitychange', resume); };
  }, [filterDate]);

  const categories = ['All', ...Array.from(new Set(clippings.map(c => c.topic || 'General').filter(Boolean)))];

  const filteredNews = clippings.filter((item) => {
    const itemCat = item.topic || 'General';
    const matchesCategory = selectedCategory === 'All' || itemCat.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.newspaperName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenAttachment = async (clip: NewsClipping) => {
    const files = clip.files || [];
    if (files.length === 0) {
      setPreviewClip(clip);
      return;
    }
    // Open the first file
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = await fetchAssetObjectUrl(files[0].url);
      setPreviewUrl(url);
      setPreviewClip(clip);
    } catch (error: any) { console.warn('Could not load clipping attachment', error); }
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
          <button
            onClick={loadClippings}
            disabled={loading}
            className="p-1.5 rounded-xl bg-black/40 border border-blue-500/30 text-blue-200 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
          Curated higher education news, national technology breakthroughs, and NIIT University press coverages directly in-app.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search headlines, keywords, or newspapers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1C1C1E] border border-gray-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <label className="block text-xs text-gray-400">Filter by date
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-800 bg-[#1C1C1E] px-3 py-2 text-white" />
      </label>

      {/* Category Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
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
        {loading && clippings.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
            <p>Loading news archives...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs">
            No news clippings found matching your search.
          </div>
        ) : (
          filteredNews.map((clip) => {
            const isSaved = savedIds.includes(clip.id);
            const topic = clip.topic || 'General';
            const source = clip.newspaperName || 'University Press';

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
                        {topic}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug pt-1">
                      {clip.title || `${topic} clipping`}
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
                  <span>{source}</span>
                </div>

                {/* Summary */}
                {clip.notes && (
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {clip.notes}
                  </p>
                )}

                {/* Attachment action button */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span className="truncate max-w-[160px] text-gray-300">
                      {clip.files && clip.files.length > 0 ? clip.files[0].originalName : clip.sourceUrl ? 'Online source' : 'No attachment'}
                    </span>
                  </div>

                  {(clip.files && clip.files.length > 0) && (
                    <button
                      onClick={() => handleOpenAttachment(clip)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Press Clip</span>
                    </button>
                  )}
                  {clip.sourceUrl && (
                    <a href={clip.sourceUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open source</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for viewing text preview if no file attached */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181B] border border-gray-700 rounded-3xl w-full max-w-lg text-white shadow-2xl p-5 space-y-3">
            <div className="flex items-start justify-between border-b border-gray-800 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400">{previewClip.topic}</span>
                <h3 className="text-sm font-bold text-white">{previewClip.title}</h3>
              </div>
              <button onClick={() => { setPreviewClip(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); setZoom(1); }} className="p-1 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewClip.files?.[0] && previewUrl ? (previewClip.files[0].mimeType === 'application/pdf' ? <iframe src={previewUrl} title={previewClip.title || 'Newspaper clipping PDF'} className="w-full h-[70vh] bg-white" /> : <div className="overflow-auto max-h-[70vh] text-center"><div className="flex justify-end gap-2 pb-2"><button onClick={() => setZoom(Math.max(.5, zoom - .25))}>−</button><button onClick={() => setZoom(Math.min(4, zoom + .25))}>＋</button></div><img src={previewUrl} alt={previewClip.title || 'Newspaper clipping'} style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="max-w-full" /></div>) : <p className="text-xs text-gray-300 leading-relaxed">{previewClip.notes || 'No text summary available.'}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
