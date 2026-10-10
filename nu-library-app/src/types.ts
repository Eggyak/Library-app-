export type UserRole = 'guest' | 'admin' | 'staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleKey?: string;
  roleName?: string;
  enrollmentNo: string;
  mobile?: string;
  dob?: string;
  bloodGroup?: string;
  programCode?: string;
  session?: string;
  currentPattern?: string;
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  motherMobile?: string;
  avatarUrl?: string;
  rfidNumber?: string;
  mustChangePassword?: boolean;
}

export interface ChapterReference {
  chapter: string;
  title: string;
  topics?: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  description?: string | null;
  coverUrl?: string | null;
  categoryId?: string | null;
  category?: string | null;
  shelfLocation?: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SearchIntentType = 'isbn' | 'title' | 'author' | 'topic' | 'general';

export interface SearchResultItem {
  book: Book;
  matchType: SearchIntentType;
  matchScore: number;
  matchedTerms: string[];
  recommendationReason?: string;
  relevantChapter?: string;
}

export interface IssuedBook {
  id: string;
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  renewalCount: number;
  fineAmount?: number;
}

export interface DiscussionRoom {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscussionRoomBooking {
  id: string;
  studentId?: string | null;
  studentEmail: string;
  studentName: string;
  enrollmentNo?: string | null;
  roomId: string;
  roomName?: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  groupSize: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  remarks?: string | null;
  overrideReason?: string | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomAvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'approved' | 'pending';
  purpose?: string;
}

export interface NewsClipping {
  id: string;
  title?: string | null;
  date: string;
  topic: string;
  newspaperName: string;
  sourceUrl?: string | null;
  notes?: string | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  files: ClippingFile[];
}

export interface ClippingFile {
  id: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
  url: string;
}

export interface LibraryVisit {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes: number;
  purpose: string;
}

export interface BookRequest {
  id: string;
  studentId?: string | null;
  studentEmail: string;
  studentName: string;
  enrollmentNo?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
    edition?: string | null;
    isbn?: string | null;
  reason: string;
  catalogBookId?: string | null;
  status: 'pending' | 'done' | 'rejected';
  remarks?: string | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryTimingItem {
  weekday: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  opening: string;
  closing: string;
  notes?: string;
}

export interface GeneralInfo {
  rulesMarkdown: string;
  timings: LibraryTimingItem[];
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  version: number;
  updatedAt?: string | null;
}

export interface HolidayItem {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  specialOpening?: string | null;
  specialClosing?: string | null;
  notes?: string | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EResourceCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EResourceItem {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  categoryId?: string | null;
  category?: string | null;
  requiresCampusNetwork: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  startsAt?: string | null;
  endsAt?: string | null;
  isPublished: boolean;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: any };
  isOffline?: boolean;
  cachedAt?: string;
}
