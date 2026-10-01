import React, { useState } from 'react';
import { PlusCircle, BookOpen, Send, CheckCircle2, History } from 'lucide-react';
import { BookRequisition, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface BookRequisitionScreenProps {
  user: UserProfile;
  requisitions: BookRequisition[];
  onRefreshData: () => void;
}

export const BookRequisitionScreen: React.FC<BookRequisitionScreenProps> = ({
  user,
  requisitions,
  onRefreshData
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !reason.trim()) return;

    StorageService.addRequisition({
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim() || 'Not specified',
      edition: edition.trim() || 'Latest edition',
      reason: reason.trim(),
      studentName: user.name,
      enrollmentNo: user.enrollmentNo
    });

    onRefreshData();
    setSuccess(true);
    setTitle('');
    setAuthor('');
    setPublisher('');
    setEdition('');
    setReason('');
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-950/80 to-[#1C1C1E] border border-pink-500/40 shadow-xl">
        <div className="flex items-center space-x-2 text-pink-300">
          <PlusCircle className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">
            Book Requisition Form
          </h2>
        </div>
        <p className="text-xs text-pink-200/80 mt-1 leading-relaxed">
          Recommend new books or specialized textbooks to be procured for the NU LIRC collection.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Book requisition submitted for Library Committee review!</span>
        </div>
      )}

      {/* Form */}
      <div className="p-4 rounded-3xl bg-[#1C1C1E] border border-[#2C2C30] space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-800">
          Propose New Book Acquisition
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Book Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Designing Data-Intensive Applications"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Author / Editor *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Martin Kleppmann"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-pink-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. O'Reilly"
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Edition / Year
              </label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="e.g. 2nd Edition"
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-hidden focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Academic Justification *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should this book be added? (e.g. Semester project reference, emerging technology, course syllabus)..."
              className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-pink-500 leading-relaxed"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-pink-700 hover:bg-pink-600 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>Submit Requisition to LIRC Committee</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submitted List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
          Submitted Requisitions ({requisitions.length})
        </h3>
        <div className="space-y-2.5">
          {requisitions.map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{req.title}</h4>
                  <p className="text-[11px] text-gray-400">By {req.author} • {req.publisher}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase">
                  {req.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 italic">
                "{req.reason}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};