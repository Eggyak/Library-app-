import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  AlertTriangle,
  Send,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DiscussionRoomBooking } from '../types';
import { StorageService } from '../services/storage';

interface AdminApprovalDeskProps {
  bookings: DiscussionRoomBooking[];
  onRefreshData: () => void;
}

export const AdminApprovalDesk: React.FC<AdminApprovalDeskProps> = ({
  bookings,
  onRefreshData
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<DiscussionRoomBooking | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleOpenActionModal = (booking: DiscussionRoomBooking, type: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setActionType(type);
    setAdminNote(type === 'approve' ? 'Approved. Collect room key & remote from circulation desk.' : 'Conflict with scheduled university session.');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (actionType === 'approve') {
      StorageService.updateBookingStatus(selectedBooking.id, 'approved', adminNote);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    } else {
      StorageService.updateBookingStatus(selectedBooking.id, 'rejected', adminNote);
    }

    onRefreshData();
    setSelectedBooking(null);
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-800/80 to-[#1C1C1E] border border-amber-600/40 shadow-lg">
        <div className="flex items-center space-x-2 text-amber-300">
          <CheckSquare className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">
            Librarian Approval Desk
          </h2>
        </div>
        <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
          Manage student room allotment requests. Review group objectives, check slot conflicts, and issue digital QR passes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('pending')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review ({pendingCount})</span>
        </button>

        <button
          onClick={() => setFilter('approved')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved ({approvedCount})</span>
        </button>

        <button
          onClick={() => setFilter('rejected')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'rejected'
              ? 'bg-red-700 text-white shadow-md'
              : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-[#8A151B] text-white shadow-md'
              : 'bg-[#1C1C1E] text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <span>All ({bookings.length})</span>
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-gray-400 text-xs">
            No requests matching this filter.
          </div>
        ) : (
          filteredBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] space-y-3 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {b.roomName}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {b.studentName} ({b.enrollmentNo})
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {b.studentEmail}
                  </p>
                </div>

                <div>
                  {b.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      PENDING
                    </span>
                  )}
                  {b.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      APPROVED
                    </span>
                  )}
                  {b.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                      REJECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Slot & Group Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#121214] p-2.5 rounded-xl border border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">Requested Slot</span>
                  <span className="font-medium text-white">{b.bookingDate}</span>
                  <div className="text-[11px] text-amber-400">{b.timeSlot}</div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">Attendees</span>
                  <span className="font-medium text-white">{b.groupSize} Students</span>
                  <div className="text-[11px] text-gray-400">Submitted: {b.submittedAt}</div>
                </div>
              </div>

              {b.additionalAttendees && b.additionalAttendees.length > 0 && (
                <div className="text-xs bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 block uppercase">Additional attendees</span>
                  <ul className="mt-1 space-y-1 text-gray-200">
                    {b.additionalAttendees.map((attendee, index) => (
                      <li key={`${attendee.enrollmentNo}-${index}`}>
                        {attendee.name} <span className="text-gray-400">({attendee.enrollmentNo})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reason of Allotment */}
              <div className="text-xs bg-black/20 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                  Reason For Allotment Request:
                </span>
                <p className="text-gray-200 italic leading-relaxed">
                  "{b.reason}"
                </p>
              </div>

              {/* Current Librarian Note if any */}
              {b.adminRemarks && (
                <div className="text-xs text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                  <span className="font-bold">Admin Note: </span> {b.adminRemarks}
                </div>
              )}

              {/* Action Buttons for Librarian */}
              <div className="pt-2 border-t border-gray-800 flex items-center justify-end space-x-2">
                {b.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleOpenActionModal(b, 'reject')}
                      className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold transition-all active:scale-95"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleOpenActionModal(b, 'approve')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Allotment</span>
                    </button>
                  </>
                )}

                {b.status === 'approved' && (
                  <button
                    onClick={() => handleOpenActionModal(b, 'reject')}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-all"
                  >
                    Revoke Approval
                  </button>
                )}

                {b.status === 'rejected' && (
                  <button
                    onClick={() => handleOpenActionModal(b, 'approve')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all"
                  >
                    Re-Approve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#18181B] border border-[#333338] rounded-3xl p-5 w-full max-w-sm text-left text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-gray-800">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  actionType === 'approve' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </span>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {selectedBooking.roomName}
                </h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1 bg-[#121214] p-3 rounded-xl border border-gray-800">
              <div><span className="text-gray-500">Student:</span> {selectedBooking.studentName} ({selectedBooking.enrollmentNo})</div>
              <div><span className="text-gray-500">Time:</span> {selectedBooking.bookingDate} • {selectedBooking.timeSlot}</div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                  {actionType === 'approve' ? 'Instructions for Student (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-amber-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg text-white ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-700 hover:bg-red-600'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {actionType === 'approve' ? 'Issue QR Allotment Pass' : 'Confirm Rejection'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};