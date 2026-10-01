export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrollmentNo: string;
  mobile: string;
  dob: string;
  bloodGroup: string;
  programCode: string;
  session: string;
  currentPattern: string;
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  avatarUrl?: string;
  rfidNumber?: string;
}

export interface ChapterReference {
  chapter: string;
  title: string;
  topics?: string[];
}

export interface Book {
  id: string;
  biblionumber?: string;
  title: string;
  author: string;
  isbn: string;
  isbns?: string[];
  publisher?: string;
  year?: string;
  callNumber: string;
  stackLocation: string;
  copiesAvailable: number;
  totalCopies: number;
  category: string;
  description?: string;
  coverImage?: string;
  topics?: string[];
  keyConcepts?: string[];
  strugglingWith?: string[];
  recommendedChapters?: ChapterReference[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
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
  isbn: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  renewalCount: number;
  fineAmount?: number;
}

export interface DiscussionRoomBooking {
  id: string;
  allotmentRef: string;
  studentName: string;
  enrollmentNo: string;
  studentEmail: string;
  bookingDate: string;
  timeSlot: string;
  groupSize: number;
  additionalAttendees?: { name: string; enrollmentNo: string }[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  submittedAt: string;
  adminRemarks?: string;
  allottedRoom?: string;
  roomName?: string;
}

export interface NewsClipping {
  id: string;
  title: string;
  date: string;
  category: 'NU in News' | 'Higher Education' | 'Science & Tech' | 'National' | 'Editorial';
  summary: string;
  keyPoints: string[];
  sourceName: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfSize?: string;
  isFeatured?: boolean;
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

export interface BookRequisition {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  edition?: string;
  reason: string;
  studentName: string;
  enrollmentNo: string;
  date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'ordered';
}

export interface LibraryTimingItem {
  dayRange: string;
  openingHours: string;
  circulationHours: string;
  notes?: string;
}
