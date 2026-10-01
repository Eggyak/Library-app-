import {
  UserProfile,
  DiscussionRoomBooking,
  NewsClipping,
  IssuedBook,
  LibraryVisit,
  Book,
  BookRequisition
} from '../types';

import {
  initialStudentUser,
  initialAdminUser,
  initialBookings,
  initialNewsClippings,
  initialIssuedBooks,
  initialVisits,
  initialRequisitions
} from '../data/mockData';
import excelCatalog from '../data/excelCatalog.json';

const KEYS = {
  CURRENT_USER: 'nu_lirc_current_user',
  BOOKINGS: 'nu_lirc_bookings',
  NEWS: 'nu_lirc_news',
  ISSUED_BOOKS: 'nu_lirc_issued_books',
  VISITS: 'nu_lirc_visits',
  ACTIVE_SESSION: 'nu_lirc_active_session',
  CATALOG: 'nu_lirc_catalog',
  REQUISITIONS: 'nu_lirc_requisitions',
  NFC_CARD_ENABLED: 'nu_lirc_nfc_card_enabled',
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  getCurrentUser(): UserProfile | null {
    return getFromStorage<UserProfile | null>(KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: UserProfile | null): void {
    setToStorage(KEYS.CURRENT_USER, user);
  },

  getNfcCardEnabled(): boolean {
    return getFromStorage<boolean>(KEYS.NFC_CARD_ENABLED, true);
  },

  setNfcCardEnabled(enabled: boolean): void {
    setToStorage(KEYS.NFC_CARD_ENABLED, enabled);
  },

  loginAsStudent(): UserProfile {
    this.setCurrentUser(initialStudentUser);
    return initialStudentUser;
  },

  loginAsAdmin(): UserProfile {
    this.setCurrentUser(initialAdminUser);
    return initialAdminUser;
  },

  logout(): void {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getBookings(): DiscussionRoomBooking[] {
    return getFromStorage<DiscussionRoomBooking[]>(KEYS.BOOKINGS, initialBookings);
  },

  addBooking(bookingData: {
    studentName: string;
    enrollmentNo: string;
    studentEmail: string;
    bookingDate: string;
    timeSlot: string;
    groupSize: number;
    additionalAttendees: { name: string; enrollmentNo: string }[];
    reason: string;
    roomId?: string;
    roomName?: string;
  }): DiscussionRoomBooking {
    const bookings = this.getBookings();
    const newBooking: DiscussionRoomBooking = {
      ...bookingData,
      id: 'bk_' + Date.now(),
      allotmentRef: 'NU-DR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    const updated = [newBooking, ...bookings];
    setToStorage(KEYS.BOOKINGS, updated);
    return newBooking;
  },

  updateBookingStatus(id: string, status: DiscussionRoomBooking['status'], adminRemarks?: string, allottedRoom?: string): void {
    const bookings = this.getBookings();
    const updated = bookings.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status,
          adminRemarks: adminRemarks !== undefined ? adminRemarks : b.adminRemarks,
          allottedRoom: allottedRoom !== undefined ? allottedRoom : b.allottedRoom
        };
      }
      return b;
    });
    setToStorage(KEYS.BOOKINGS, updated);
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter(b => b.id !== id);
    setToStorage(KEYS.BOOKINGS, bookings);
  },

  getNewsClippings(): NewsClipping[] {
    return getFromStorage<NewsClipping[]>(KEYS.NEWS, initialNewsClippings);
  },

  addNewsClipping(clip: Omit<NewsClipping, 'id'>): NewsClipping {
    const list = this.getNewsClippings();
    const newClip: NewsClipping = {
      ...clip,
      id: 'news_' + Date.now()
    };
    const updated = [newClip, ...list];
    setToStorage(KEYS.NEWS, updated);
    return newClip;
  },

  deleteNewsClipping(id: string): void {
    const list = this.getNewsClippings().filter(n => n.id !== id);
    setToStorage(KEYS.NEWS, list);
  },

  getIssuedBooks(): IssuedBook[] {
    return getFromStorage<IssuedBook[]>(KEYS.ISSUED_BOOKS, initialIssuedBooks);
  },

  renewBook(issuedBookId: string): boolean {
    const books = this.getIssuedBooks();
    const updated = books.map(b => {
      if (b.id === issuedBookId && b.renewalCount < 2) {
        const parts = b.dueDate.split(' ');
        const day = parseInt(parts[0], 10);
        const newDueDate = `${day + 14 > 30 ? (day + 14 - 30) : (day + 14)} Oct 2026`;
        return {
          ...b,
          dueDate: newDueDate,
          renewalCount: b.renewalCount + 1
        };
      }
      return b;
    });
    setToStorage(KEYS.ISSUED_BOOKS, updated);
    return true;
  },

  getVisits(): LibraryVisit[] {
    return getFromStorage<LibraryVisit[]>(KEYS.VISITS, initialVisits);
  },

  logManualVisit(durationMinutes: number = 120, purpose: string = 'Self Study & Reading'): LibraryVisit {
    const visits = this.getVisits();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newVisit: LibraryVisit = {
      id: 'v_' + Date.now(),
      studentId: 'usr_student_01',
      studentName: 'Yash Kumar',
      date: today,
      entryTime: new Date(Date.now() - durationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes,
      purpose
    };
    setToStorage(KEYS.VISITS, [newVisit, ...visits]);
    return newVisit;
  },

  getCatalog(): Book[] {
    return excelCatalog as Book[];
  },

  getRequisitions(): BookRequisition[] {
    return getFromStorage<BookRequisition[]>(KEYS.REQUISITIONS, initialRequisitions);
  },

  addRequisition(req: Omit<BookRequisition, 'id' | 'date' | 'status'>): BookRequisition {
    const list = this.getRequisitions();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newReq: BookRequisition = {
      ...req,
      id: 'req_' + Date.now(),
      date: today,
      status: 'submitted'
    };
    setToStorage(KEYS.REQUISITIONS, [newReq, ...list]);
    return newReq;
  },

  resetAllData(): void {
    localStorage.clear();
  }
};