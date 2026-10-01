import React, { useState } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  X,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, DiscussionRoomBooking } from '../types';
import { StorageService } from '../services/storage';

interface DiscussionRoomScreenProps {
  user: UserProfile;
  bookings: DiscussionRoomBooking[];
  onRefreshData: () => void;
}

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
  '08:00 PM - 10:00 PM'
];

const ROOM_INFO = [
  { name: 'Discussion Room 1', capacity: 6, features: ['Whiteboard', 'Projector', 'AC', 'WiFi'] },
  { name: 'Discussion Room 2', capacity: 8, features: ['Whiteboard', 'Projector', 'AC', 'WiFi', 'Video Conference'] },
  { name: 'Discussion Room 3', capacity: 10, features: ['Whiteboard', 'Projector', 'AC', 'WiFi', 'Video Conference'] },
  { name: 'Discussion Room 4 (Seminar Room)', capacity: 20, features: ['Whiteboard', 'Projector', 'AC', 'WiFi', 'Video Conference', 'Podium', 'Sound System'] },
];

export const DiscussionRoomScreen: React.FC<DiscussionRoomScreenProps> = ({
  user,
  bookings,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'my_bookings'>('form');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [groupSize, setGroupSize] = useState('');
  const [additionalAttendees, setAdditionalAttendees] = useState<{ name: string; enrollmentNo: string }[]>([]);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const myBookings = bookings.filter(b => b.enrollmentNo === user.enrollmentNo);
  const additionalAttendeeCount = Math.max(0, Math.min(Number(groupSize) || 0, 5) - 1);

  const handleGroupSizeChange = (value: string) => {
    setGroupSize(value);
    const requestedSize = Math.max(0, Math.min(Number(value) || 0, 5) - 1);
    setAdditionalAttendees(current => Array.from(
      { length: requestedSize },
      (_, index) => current[index] ?? { name: '', enrollmentNo: '' }
    ));
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !groupSize) return;

    const timeSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    const groupSizeNum = parseInt(groupSize, 10);
    if (groupSizeNum < 2 || groupSizeNum > 5 || additionalAttendees.length !== groupSizeNum - 1) return;
    if (additionalAttendees.some(attendee => !attendee.name.trim() || !attendee.enrollmentNo.trim())) return;

    // Find which room fits the group size
    const availableRoom = ROOM_INFO.find(r => r.capacity >= groupSizeNum) || ROOM_INFO[ROOM_INFO.length - 1];

    StorageService.addBooking({
      roomId: availableRoom.name.toLowerCase().replace(/\s+/g, '_'),
      roomName: availableRoom.name,
      studentName: user.name,
      enrollmentNo: user.enrollmentNo,
      studentEmail: user.email,
      bookingDate,
      timeSlot,
      groupSize: groupSizeNum,
      additionalAttendees: additionalAttendees.map(attendee => ({
        name: attendee.name.trim(),
        enrollmentNo: attendee.enrollmentNo.trim()
      })),
      reason: reason.trim()
    });

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    onRefreshData();
    setSuccessMessage('Booking request submitted! Awaiting Librarian approval.');
    setReason('');
    setGroupSize('');
    setAdditionalAttendees([]);
    setActiveTab('my_bookings');
  };

  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Cancel this discussion room reservation request?')) {
      StorageService.deleteBooking(bookingId);
      onRefreshData();
    }
  };

  // Get approved booking for display
  const approvedBooking = myBookings.find(b => b.status === 'approved');

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

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB 1: BOOKING FORM */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Booking Form */}
          <form onSubmit={handleSubmitBooking} className="space-y-4 rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] p-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-[#2C2C30]">Booking Request Form</h3>

            {/* Student Info Header */}
            <div className="p-3 rounded-xl bg-[#121214] border border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-800 to-amber-700 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-white font-mono">{user.enrollmentNo}</div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                required
              />
            </div>

            {/* Time Slot */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                  required
                />
              </div>
            </div>

            {/* Group size includes the requester */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">Total Attendees (including you)</label>
              <input
                type="number"
                min={2}
                max={5}
                value={groupSize}
                onChange={(e) => handleGroupSizeChange(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                required
              />
              <p className="mt-1 text-[10px] text-gray-400">Maximum 5 people. Enter the number of other attendees below.</p>
            </div>

            {Array.from({ length: additionalAttendeeCount }, (_, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-gray-800 bg-[#121214] p-3">
                <h4 className="text-xs font-semibold text-gray-200">Additional attendee {index + 1}</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Full name</label>
                  <input
                    type="text"
                    value={additionalAttendees[index]?.name ?? ''}
                    onChange={(e) => setAdditionalAttendees(current => current.map((attendee, attendeeIndex) =>
                      attendeeIndex === index ? { ...attendee, name: e.target.value } : attendee
                    ))}
                    className="w-full bg-[#0E0E10] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Enrollment number</label>
                  <input
                    type="text"
                    value={additionalAttendees[index]?.enrollmentNo ?? ''}
                    onChange={(e) => setAdditionalAttendees(current => current.map((attendee, attendeeIndex) =>
                      attendeeIndex === index ? { ...attendee, enrollmentNo: e.target.value } : attendee
                    ))}
                    className="w-full bg-[#0E0E10] border border-gray-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-[#8A151B]"
                    required
                  />
                </div>
              </div>
            ))}

            {/* Purpose (Required) */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">Purpose *</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Group study, project discussion, presentation prep..."
                className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:outline-hidden focus:border-[#8A151B] leading-relaxed"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!reason.trim()}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-lg ${
                  reason.trim()
                    ? 'bg-[#8A151B] hover:bg-red-700'
                    : 'bg-gray-700 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Submit to Librarian for Approval</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-3.5">
          {myBookings.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-[#1C1C1E] border border-gray-800 space-y-3">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
              <h4 className="text-sm font-semibold text-gray-300">No Reservation Requests Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">Use the "Book Discussion Room" tab to submit a new request for your group study or project work.</p>
              <button onClick={() => setActiveTab('form')} className="px-4 py-2 rounded-xl bg-[#8A151B] text-white text-xs font-semibold">Submit Request</button>
            </div>
          ) : (
            myBookings.map((b) => (
              <div key={b.id} className={`rounded-2xl p-4 border transition-all ${b.status === 'approved' ? 'bg-[#17251e] border-emerald-500/40' : b.status === 'rejected' ? 'bg-red-950/20 border-red-500/30' : 'bg-[#1C1C1E] border-[#2C2C30]'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {b.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" /><span>APPROVED</span>
                        </span>
                      )}
                      {b.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" /><span>PENDING LIBRARIAN APPROVAL</span>
                        </span>
                      )}
                      {b.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30 flex items-center space-x-1">
                          <XCircle className="w-3 h-3" /><span>REJECTED</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">{b.roomName}</h4>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-300 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Date & Slot</span>
                    <span className="font-medium text-white">{b.bookingDate}</span>
                    <div className="text-[11px] text-white">{b.timeSlot}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block uppercase">Group Size</span>
                    <span className="font-medium text-white">{b.groupSize} Members</span>
                  </div>
                </div>

                {b.additionalAttendees && b.additionalAttendees.length > 0 && (
                  <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-2.5">
                    <span className="text-[10px] font-semibold uppercase text-gray-500">Additional attendees</span>
                    <ul className="mt-1 space-y-1 text-xs text-gray-200">
                      {b.additionalAttendees.map((attendee, index) => (
                        <li key={`${attendee.enrollmentNo}-${index}`}>
                          {attendee.name} <span className="text-gray-400">({attendee.enrollmentNo})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CASE 1: Rejected with Librarian Label + Note */}
                {b.status === 'rejected' && b.adminRemarks && b.adminRemarks.trim() !== '' && (
                  <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30">
                    <div className="flex items-center space-x-2 text-xs text-red-300 mb-2">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">Librarian</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold border border-red-500/30">Rejected</span>
                    </div>
                    <div className="text-xs text-red-200">
                      <span className="font-bold">Librarian Note: </span>{b.adminRemarks}
                    </div>
                  </div>
                )}

                {/* CASE 2: Approved with Librarian Label + Note */}
                {b.status === 'approved' && b.adminRemarks && b.adminRemarks.trim() !== '' && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="flex items-center space-x-2 text-xs text-emerald-300 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">Librarian</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">Approved</span>
                    </div>
                    <div className="text-xs text-emerald-200">
                      <span className="font-bold">Librarian Note: </span>{b.adminRemarks}
                    </div>
                  </div>
                )}

                {/* CASE 3: Approved with Librarian Label, NO Note */}
                {b.status === 'approved' && (!b.adminRemarks || b.adminRemarks.trim() === '') && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="flex items-center space-x-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">Librarian</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">Approved</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  {b.status === 'pending' && (
                    <button onClick={() => handleCancelBooking(b.id)} className="text-xs text-red-400 hover:text-red-300 underline font-medium">Cancel Request</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};