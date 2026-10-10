import React, { useState } from 'react';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Star,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  Tag
} from 'lucide-react';
import { UserProfile, ApiResponse } from '../types';
import { Api } from '../services/api';
import { trackEngagement } from '../components/EngagementTracker';

const FEEDBACK_CATEGORIES = [
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'other', label: 'Other', icon: HelpCircle },
] as const;

interface FeedbackFormScreenProps {
  user?: UserProfile;
}

type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number]['value'];

export const FeedbackFormScreen: React.FC<FeedbackFormScreenProps> = ({ user: _user }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setLoading(true);
    setSubmitStatus(null);
    trackEngagement('feedback_submit', `Submitted feedback: ${subject}`, <MessageSquare className="w-3.5 h-3.5 text-blue-400" />);

    try {
      const res: ApiResponse<{ id: string; status: string }> = await Api.submitFeedback({
        subject,
        message,
        category,
        rating: rating > 0 ? rating : undefined,
      });

      if (res.success) {
        setSubmitStatus({ success: true, message: 'Feedback submitted successfully! Thank you for your input.' });
        setSubject('');
        setMessage('');
        setRating(0);
        setCategory('general');
      } else {
        throw new Error(res.error?.message || 'Failed to submit feedback');
      }
    } catch (err: any) {
      setSubmitStatus({ success: false, message: err.message || 'Unable to submit feedback. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Feedback</h2>
          <p className="text-xs text-gray-400">Share your thoughts about the NU LIRC app</p>
        </div>
        <Tag className="w-5 h-5 text-gray-500" />
      </div>

      {/* Submit Status */}
      {submitStatus && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start space-x-2 ${
            submitStatus.success
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/80 border-red-500/50 text-red-200'
          }`}
        >
          {submitStatus.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span>{submitStatus.message}</span>
        </div>
      )}

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Subject
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your feedback"
            className="w-full rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8A151B] transition-all"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FEEDBACK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#8A151B] border-[#8A151B] text-white'
                      : 'bg-[#1C1C1E] border-[#2C2C30] text-gray-400 hover:bg-[#242428] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Star Rating */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Rating (Optional)
          </label>
          <div className="flex items-center space-x-1">
            {ratingOptions.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                className="p-0.5 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    num <= rating
                      ? 'text-amber-400 fill-current'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Message
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your feedback in detail..."
            rows={5}
            className="w-full rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8A151B] transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !subject.trim() || !message.trim()}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#8A151B] hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
