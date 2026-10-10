import React, { useState, useEffect } from 'react';
import { PlusCircle, BookOpen, Send, CheckCircle2, History, RefreshCw, AlertCircle } from 'lucide-react';
import { BookRequest, UserProfile } from '../types';
import { Api } from '../services/api';

interface BookRequisitionScreenProps {
  user: UserProfile;
  onRefreshData?: () => void;
}

export const BookRequisitionScreen: React.FC<BookRequisitionScreenProps> = ({
  user,
  onRefreshData
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('');
  const [isbn, setIsbn] = useState('');
  const [reason, setReason] = useState('');
  const [studentName, setStudentName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [myRequests, setMyRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await Api.getMyBookRequests();
      setMyRequests(res.data?.items || []);
    } catch (err) {
      console.warn('Failed to load requisitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const handleUpdate = () => loadRequests();
    window.addEventListener('lirc:realtime:book_requests', handleUpdate);
    return () => window.removeEventListener('lirc:realtime:book_requests', handleUpdate);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !reason.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccess(false);

    try {
      await Api.submitBookRequest({
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim() || undefined,
        edition: edition.trim() || undefined,
        isbn: isbn.trim() || undefined,
        reason: reason.trim(),
        studentName: studentName.trim(),
        enrollmentNo: enrollmentNo.trim(),
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim()
      });

      setSuccess(true);
      setTitle('');
      setAuthor('');
      setPublisher('');
      setEdition('');
      setIsbn('');
      setReason('');
      await loadRequests();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit book requisition');
    } finally {
      setIsSubmitting(false);
    }
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
          Recommend new textbooks, research volumes, or monographs to be acquired by the NIIT University Library Committee.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Book requisition submitted successfully for Librarian review!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <div className="p-4 rounded-3xl bg-[#1C1C1E] border border-[#2C2C30] space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-800">
          Propose New Book Acquisition
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <label>Full name *<input required value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
          <label>Enrollment / Student ID *<input required value={enrollmentNo} onChange={e => setEnrollmentNo(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
          <label>University email *<input required type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
          <label>Phone *<input required type="tel" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Book Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Electrodynamics"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Author(s) *
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. David J. Griffiths"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
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
                placeholder="e.g. Cambridge Univ Press"
                className="w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
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
                placeholder="e.g. 4th Edition, 2021"
                className="w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              ISBN (Optional)
            </label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 9781108420419"
              className="w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              Academic Justification / Course Code *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required reference book for course ECE301 / Capstone research..."
              className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 leading-relaxed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !author.trim() || !reason.trim()}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Requisition Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Requisitions History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <History className="w-4 h-4 text-pink-400" />
            <span>My Submitted Requisitions</span>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-center text-xs text-gray-500">
            No book requests submitted yet.
          </div>
        ) : (
          myRequests.map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-gray-800 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{req.title}</h4>
                  <p className="text-gray-400 text-[11px]">By {req.author}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    req.status === 'done'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : req.status === 'rejected'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {req.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>

              {req.remarks && (
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                  <span className="font-bold">Staff Update: </span>
                  <span>{req.remarks}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
