import React, { useState } from 'react';
import {
  Newspaper,
  Upload,
  Send,
  Plus,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NewsClipping } from '../types';
import { StorageService } from '../services/storage';

interface AdminNewsPublishProps {
  news: NewsClipping[];
  onRefreshData: () => void;
}

export const AdminNewsPublish: React.FC<AdminNewsPublishProps> = ({
  news,
  onRefreshData
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('19 Sep 2026');
  const [category, setCategory] = useState<NewsClipping['category']>('NU in News');
  const [sourceName, setSourceName] = useState('The Economic Times');
  const [summary, setSummary] = useState('');
  const [keyPointsStr, setKeyPointsStr] = useState('');
  const [pdfFileName, setPdfFileName] = useState('NU_Daily_News_Clip_19Sep2026.pdf');
  const [pdfSize, setPdfSize] = useState('1.2 MB');
  const [isFeatured, setIsFeatured] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const points = keyPointsStr
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    StorageService.addNewsClipping({
      title: title.trim(),
      date,
      category,
      sourceName,
      summary: summary.trim(),
      keyPoints: points.length > 0 ? points : ['Verified by LIRC administration.'],
      pdfFileName,
      pdfSize,
      isFeatured
    });

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onRefreshData();
    setSuccess(true);
    setTitle('');
    setSummary('');
    setKeyPointsStr('');
    setTimeout(() => setSuccess(false), 4000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this published clipping from students\' feeds?')) {
      StorageService.deleteNewsClipping(id);
      onRefreshData();
    }
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in text-white pb-24">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/80 to-[#1C1C1E] border border-blue-600/40 shadow-lg">
        <div className="flex items-center space-x-2 text-blue-300">
          <Newspaper className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">
            Publish Daily News Clipping
          </h2>
        </div>
        <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
          Replace email distribution. Upload daily news clippings with PDF attachments to broadcast directly to students in the app.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>News clipping published and broadcasted to student app!</span>
        </div>
      )}

      {/* Publish Form */}
      <div className="p-4 rounded-3xl bg-[#1C1C1E] border border-[#2C2C30] shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-blue-400" />
          <span>New Clipping Broadcast</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Headline / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NIIT University Signs Industry MoU for Quantum Computing Lab"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="NU in News">NU in News</option>
                <option value="Higher Education">Higher Education</option>
                <option value="Science & Tech">Science & Tech</option>
                <option value="National">National</option>
                <option value="Editorial">Editorial</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Source Newspaper / Media
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. The Times of India"
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Publication Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Summary / Core Article Text *
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter a concise summary of the article for students..."
              className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Key Bullet Points (1 per line)
            </label>
            <textarea
              rows={2}
              value={keyPointsStr}
              onChange={(e) => setKeyPointsStr(e.target.value)}
              placeholder="Key point 1&#10;Key point 2"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Attach PDF */}
          <div className="p-3 rounded-2xl bg-[#121214] border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-300">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Attach Newspaper PDF File</span>
              </div>
              <span className="text-[10px] text-gray-500">Replaces email attachment</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder="filename.pdf"
                className="bg-[#1C1C1E] border border-gray-700 rounded-xl py-1.5 px-2.5 text-xs text-white"
              />
              <input
                type="text"
                value={pdfSize}
                onChange={(e) => setPdfSize(e.target.value)}
                placeholder="e.g. 1.2 MB"
                className="bg-[#1C1C1E] border border-gray-700 rounded-xl py-1.5 px-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-[#121214]"
            />
            <label htmlFor="featured" className="text-xs text-gray-300 font-medium">
              Pin to Top (Featured Headline on Student Dashboard)
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast News Clipping to All Students</span>
            </button>
          </div>
        </form>
      </div>

      {/* Previously Published List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Previously Published ({news.length})
        </h3>
        <div className="space-y-2.5">
          {news.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] flex items-center justify-between"
            >
              <div className="pr-3 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-blue-400">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-gray-500">• {item.date}</span>
                </div>
                <h4 className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {item.sourceName} • {item.pdfFileName}
                </p>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                title="Delete Clipping"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};