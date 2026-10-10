import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  X,
  Clock,
  Trash2,
  RefreshCw,
  DoorOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, DiscussionRoomBooking, DiscussionRoom } from '../types';
import { Api } from '../services/api';

interface DiscussionRoomScreenProps {
  user: UserProfile;
  bookings?: DiscussionRoomBooking[];
  onRefreshData?: () => void;
}

export const DiscussionRoomScreen: React.FC<DiscussionRoomScreenProps> = ({
  user,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'my_bookings'>('form');
  const [rooms, setRooms] = useState<DiscussionRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [groupSize, setGroupSize] = useState('3');
  const [additionalAttendees, setAdditionalAttendees] = useState<{ name: string; enrollmentNo: string }[]>([
    { name: '', enrollmentNo: '' },
    { name: '', enrollmentNo: '' }
  ]);
  const [reason, setReason] = useState('');
  const [studentName, setStudentName] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [myBookings, setMyBookings] = useState<DiscussionRoomBooking[]>([]);

  // Load rooms and user bookings
  useEffect(() => {
    loadRooms();
    loadMyBookings();

    const handleUpdate = () => {
      loadRooms();
      loadMyBookings();
    };
    const handleResume = () => { if (document.visibilityState === 'visible') handleUpdate(); };
    const poll = window.setInterval(handleResume, 20000);
    window.addEventListener('lirc:realtime:discussion_rooms', handleUpdate);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('lirc:realtime:discussion_rooms', handleUpdate);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  const loadRooms = async () => {
    try {
      const res = await Api.getRooms();
      const roomList = Array.isArray(res.data?.items) ? res.data.items : [];
      setRooms(roomList);
      if (roomList.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomList[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms:', err);
    }
  };

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const res = await Api.getMyRoomRequests();
      setMyBookings(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (err) {
      console.warn('Failed to load my room requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSizeChange = (value: string) => {
    setGroupSize(value);
    const requestedSize = Math.max(0, Math.min(Number(value) || 0, 10) - 1);
    setAdditionalAttendees(current => Array.from(
      { length: requestedSize },
      (_, index) => current[index] ?? { name: '', enrollmentNo: '' }
    ));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !groupSize || !selectedRoomId) return;

    const groupSizeNum = parseInt(groupSize, 10);
    if (groupSizeNum < 1) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await Api.submitRoomRequest({
        roomId: selectedRoomId,
        date: bookingDate,
        startTime,
        endTime,
        purpose: reason.trim(),
        groupSize: groupSizeNum,
        studentName: studentName.trim(),
        enrollmentNo: enrollmentNo.trim(),
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim(),
      });

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      setSuccessMessage('Booking request submitted successfully! Awaiting Librarian review.');
      setReason('');
      await loadMyBookings();
      if (onRefreshData) onRefreshData();
      setActiveTab('my_bookings');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit room booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this discussion room reservation request?')) return;
    try {
      await Api.cancelRoomRequest(bookingId);
      await loadMyBookings();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(`Could not cancel request: ${err.message || 'Error'}`);
    }
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Top Tabs */}
      <div className="flex border-b border-[#2C2C30] relative">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 pb-3 text-sm font-semibold tracking-wide transition-all relative ${
            activeTab === 'form' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>Book Discussion Room</span>
          {activeTab === 'form' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_bookings')}
          className={`flex-1 pb-3 text-sm font-semibold tracking-wide transition-all relative flex items-center justify-center space-x-2 ${
            activeTab === 'my_bookings' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>My Requests</span>
          {myBookings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#8A151B] text-white font-bold">
              {myBookings.length}
            </span>
          )}
          {activeTab === 'my_bookings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB 1: BOOKING FORM */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          <form onSubmit={handleSubmitBooking} className="space-y-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] p-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-[#2C2C30]">
              Discussion Room Reservation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] text-gray-300">Full name *<input required value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
              <label className="text-[11px] text-gray-300">Enrollment / Student ID *<input required value={enrollmentNo} onChange={e => setEnrollmentNo(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
              <label className="text-[11px] text-gray-300">University email *<input required type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
              <label className="text-[11px] text-gray-300">Phone *<input required type="tel" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} className="mt-1 w-full bg-[#121214] border border-gray-700 rounded-xl px-3 py-2 text-white" /></label>
            </div>

            {/* Select Room */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Select Discussion Room *
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#8A151B]"
                required
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Capacity: {room.capacity} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Reservation Date *
              </label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#8A151B]"
                required
              />
            </div>

            {/* Time Slot */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#8A151B]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#8A151B]"
                  required
                />
              </div>
            </div>

            {/* Group size */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Total Attendees (including you) *
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={groupSize}
                onChange={(e) => handleGroupSizeChange(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#8A151B]"
                required
              />
            </div>

            {/* Additional Attendees */}
            {additionalAttendees.map((att, idx) => (
              <div key={idx} className="space-y-2 rounded-xl border border-gray-800 bg-[#121214] p-3">
                <h4 className="text-xs font-semibold text-gray-200">Attendee {idx + 2}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={att.name}
                    onChange={(e) =>
                      setAdditionalAttendees(curr =>
                        curr.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                      )
                    }
                    className="w-full bg-[#0E0E10] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Enrollment No"
                    value={att.enrollmentNo}
                    onChange={(e) =>
                      setAdditionalAttendees(curr =>
                        curr.map((item, i) => (i === idx ? { ...item, enrollmentNo: e.target.value } : item))
                      )
                    }
                    className="w-full bg-[#0E0E10] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>
            ))}

            {/* Purpose */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">
                Purpose of Discussion *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Capstone project meeting, group assignment, presentation dry-run..."
                className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#8A151B] leading-relaxed"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="w-full py-3 rounded-xl bg-[#8A151B] hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Reservation Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-3.5">
          <div className="flex justify-end">
            <button
              onClick={loadMyBookings}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] border border-gray-800 text-xs text-gray-300 hover:text-white flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-[#1C1C1E] border border-gray-800 space-y-3">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
              <h4 className="text-sm font-semibold text-gray-300">No Reservation Requests Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Use the "Book Discussion Room" tab to submit a new request.
              </p>
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl bg-[#8A151B] text-white text-xs font-semibold"
              >
                Book a Room Now
              </button>
            </div>
          ) : (
            myBookings.map((b) => (
              <div
                key={b.id}
                className={`rounded-2xl p-4 border transition-all ${
                  b.status === 'approved'
                    ? 'bg-[#17251e] border-emerald-500/40'
                    : b.status === 'denied'
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-[#1C1C1E] border-[#2C2C30]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.roomName || 'Discussion Room'}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      <span>{b.date}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{b.startTime} - {b.endTime}</span>
                    </div>
                  </div>
                  <div>
                    {b.status === 'approved' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>APPROVED</span>
                      </span>
                    ) : b.status === 'denied' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30 flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>DENIED</span>
                      </span>
                    ) : b.status === 'cancelled' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-[10px] font-bold border border-gray-500/30">
                        CANCELLED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>PENDING</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <div>
                    <span className="font-semibold text-gray-400">Purpose: </span>
                    <span>{b.purpose}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-400">Group Size: </span>
                    <span>{b.groupSize} attendees</span>
                  </div>
                </div>

                {b.remarks && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                    <span className="font-bold">Librarian Note: </span>
                    <span>{b.remarks}</span>
                  </div>
                )}

                {(b.status === 'pending' || b.status === 'approved') && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3 py-1 rounded-xl bg-red-950/40 hover:bg-red-900 border border-red-700/50 text-red-300 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Cancel Reservation</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
