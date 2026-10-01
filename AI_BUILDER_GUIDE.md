# NIIT University Library App - AI Builder Guide

## Project Overview
This is a **React + TypeScript + Vite** Progressive Web App (PWA) for NIIT University's Learning & Information Resource Centre (LIRC). Built as an offline-first Capacitor Android app with professional UI matching the college's official student app color scheme.

**Live Library Website:** https://library.niituniversity.in/

---

## Tech Stack
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS (custom dark theme with NU maroon `#8A151B` primary)
- **Mobile:** Capacitor 6 for Android
- **Icons:** Lucide React
- **State:** React hooks + localStorage (offline-first)
- **Charts/Animations:** canvas-confetti for celebrations

---

## Project Structure
```
nu-library-app/
├── public/
│   ├── assets/           # Images (logo, campus photos)
│   └── manifest.json     # PWA manifest
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── DrawerNavigation.tsx   # Side navigation drawer
│   │   ├── HeaderBar.tsx          # Top app bar
│   │   └── MobileFrame.tsx        # Phone viewport wrapper
│   ├── screens/          # Page-level components
│   │   ├── StudentDashboard.tsx   # Main student home
│   │   ├── DiscussionRoomScreen.tsx # Room booking (student)
│   │   ├── AdminApprovalDesk.tsx   # Room approvals (admin)
│   │   ├── NewsClippingsScreen.tsx # Daily news PDFs
│   │   ├── AdminNewsPublish.tsx    # Publish news (admin)
│   │   ├── LibraryStatsScreen.tsx  # Visits, books, hours
│   │   ├── OpacCatalogScreen.tsx   # Koha OPAC search
│   │   ├── BookRequisitionScreen.tsx # Book purchase requests
│   │   ├── LircInfoScreen.tsx      # Timings & Rules
│   │   ├── LircResourcesScreen.tsx # All e-resources & links
│   │   ├── NewArrivalsScreen.tsx   # New book arrivals
│   │   ├── LoginScreen.tsx         # Login with role switch
│   │   └── SettingsScreen.tsx      # Settings & role toggle
│   ├── services/
│   │   └── storage.ts      # localStorage wrapper (offline DB)
│   ├── data/
│   │   ├── libraryLinks.ts     # 150+ affiliated resource links
│   │   ├── mockData.ts         # Demo users, bookings, news, books
│   │   └── newArrivalsData.ts  # 14 new arrival books from Koha
│   ├── types.ts              # TypeScript interfaces
│   ├── App.tsx               # Root component, routing, state
│   └── main.tsx              # Entry point
├── capacitor.config.ts       # Capacitor Android config
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Key Features Implemented

### 1. **Student Dashboard** (`StudentDashboard.tsx`)
- Welcome banner with student info
- Library engagement stats: Total visits, study hours, issued books, active room pass
- Currently borrowed books with renew buttons (max 2 renewals)
- Daily news clipping preview
- Quick action grid: Book Room, Koha OPAC, Request Book, LIRC Hours, New Arrivals, All Resources
- **New Arrivals Preview** - shows latest 3 books from Koha

### 2. **Discussion Room Booking** (`DiscussionRoomScreen.tsx`)
- **Single unified form** - no room selection dropdown
- Auto-assigns room based on group size (4 rooms: 6, 8, 10, 20 capacity)
- Fields: Date, Time Slot, Group Size (min 2, no max), Reason (required)
- Submits to librarian for approval
- My Requests tab shows pending/approved/rejected with admin remarks
- **No QR codes** - students use RFID cards at gate

### 3. **Admin Approval Desk** (`AdminApprovalDesk.tsx`)
- Lists all pending bookings
- Approve/Reject with remarks
- Auto-assigns room on approval

### 4. **Daily News Clippings** (`NewsClippingsScreen.tsx` + `AdminNewsPublish.tsx`)
- Student view: List of news with PDF download
- Admin view: Create news with title, category, summary, key points, PDF upload (base64)
- PDFs stored in localStorage as base64

### 5. **Library Stats & Books** (`LibraryStatsScreen.tsx`)
- Metrics: Visits, Hours, Current Books, Fines
- Tabs: Present Books (with renew), Past Borrowed, Visit Log
- Visit log shows date, time, duration, purpose

### 6. **Koha OPAC Catalog** (`OpacCatalogScreen.tsx`)
- Search local catalog (10 sample books from Koha)
- View details: call number, shelf location, availability
- Navigate to Book Requisition

### 7. **Book Requisition** (`BookRequisitionScreen.tsx`)
- Students request new book purchases
- Admin can review

### 7. **LIRC Info** (`LircInfoScreen.tsx`)
- Tabs: Timings, Rules (General Regulations)

### 8. **LIRC Resources** (`LircResourcesScreen.tsx`) - **NEW**
- **150+ affiliated links** organized in 10 categories:
  1. LIRC@NU (About Us, Timings, Team, Rules, Annual Reports, ICT Initiatives, Manual, Ask Librarian, Book Requisition, Feedback)
  2. Institutional Repository (DRNU, Question Papers)
  3. e-Resources (EBSCO, JSTOR, CMIE, IEEE, HBSP, Magzter, Courseware, ETIC, IKS, MOOC, Software, South Asia Archive, Theses)
  4. Publication@NU (IRINS, Engineering, Humanities, Management, Math)
  5. Research Services (Schemes, Articles Request, ETDs, Scopus, ORCID, QuillBot, UGC-CARE, COPE, Publons, WoS, Mendeley, Turnitin, Literature Search, Sherpa Romeo)
  6. Remote Access (INFED Shibboleth, NDL, DELNET, e-ShodhSindhu, Shodhganga, ShodhShuddhi)
  7. Special Library (Sugamaya Pustakalaya, Bookshare, Disability Knowledge)
  8. Online Learning (UGC, SWAYAM, Vidya-Mitra, SWAYAM PRABHA, ICSSR, NPTEL, Virtual Labs, Spoken Tutorial)
  9. NU@INFLIBNET (ILMS, Vidwan, IRINS, Parliament Library)
  10. Social Media (YouTube, Facebook, Twitter, Instagram, LinkedIn)
- Searchable, collapsible categories
- Opens links in new tab (affiliated links preserved)

### 9. **New Arrivals** (`NewArrivalsScreen.tsx`) - **NEW**
- 14 latest books from Koha with biblionumbers
- Shows: title, author, category, year, call number, shelf location, description
- Direct link to Koha OPAC detail page

### 10. **Authentication & Role Switch**
- Login screen (demo: any email/password)
- Role toggle in header: Student ↔ Librarian Admin
- Persisted in localStorage

---

## Data Models (`types.ts`)
```typescript
UserProfile          // Student or Admin
DiscussionRoomBooking // Room reservation with status
NewsClipping         // News with PDF (base64)
IssuedBook           // Current/past loans
LibraryVisit         // Entry/exit logs
BookRequisition      // Purchase requests
Book                 // Koha catalog entry
LibraryTimingItem    // Hours schedule
```

---

## Storage Service (`services/storage.ts`)
Offline-first localStorage wrapper with keys:
- `nulirc_current_user` - logged in user
- `nulirc_bookings` - room bookings
- `nulirc_news` - news clippings
- `nulirc_issued_books` - book loans
- `nulirc_visits` - library visits
- `nulirc_requisitions` - book requests
- `nulirc_active_session` - gate check-in session

Methods: CRUD for each + `resetAllData()`, `loginAsStudent()`, `loginAsAdmin()`

---

## Color Scheme (Tailwind Config)
```css
Primary:    #8A151B  (NU Maroon)
Background: #0E0E10  (Near black)
Surface:    #1C1C1E  (Dark card)
Border:     #2C2C30  (Subtle border)
Accent:     #FFA726  (Amber for timings)
Success:    #4CAF50  (Emerald)
Error:      #FF5252  (Red)
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Start
```bash
cd nu-library-app
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### Or use the batch file:
```
start.bat
```
This auto-detects your LAN IP and shows both URLs:
- Local: http://localhost:5173
- Network: http://YOUR_IP:5173 (use on phone/tablet on same WiFi)

---

## Building for Android

### 1. Build Web Assets
```bash
npm run build
```

### 2. Sync to Capacitor
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build APK
- In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
- Or CLI: `./gradlew assembleDebug` in `android/` folder

### Capacitor Config (`capacitor.config.ts`)
```typescript
{
  appId: 'in.niituniversity.lirc',
  appName: 'NU LIRC',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
}
```

---

## Key Implementation Decisions

### Removed (Per Requirements)
- ❌ Profile screen (replaced by RFID-based identity)
- ❌ Important Contacts (merged into LIRC Resources)
- ❌ Digital ID Modal / QR Code (students use physical RFID cards)
- ❌ Room selection in booking (auto-assigned by group size)
- ❌ Max group size limit (up to 20 in Seminar Room)

### Added (Per Requirements)
- ✅ LIRC Resources screen with all 150+ links from library website
- ✅ New Arrivals section on dashboard + dedicated screen
- ✅ Professional UI matching college app (dark theme, maroon accents)
- ✅ Simplified discussion room booking (single form)
- ✅ No max limit on group size
- ✅ start.bat with network URL for phone testing
- ✅ Comprehensive documentation for AI handoff

---

## Data Sources
All links in `libraryLinks.ts` are **actual affiliated links** from https://library.niituniversity.in/
- Google Drive/SharePoint links for internal docs
- Direct URLs for EBSCO, IEEE, JSTOR, etc.
- INFED Shibboleth for remote access
- Government portals: NDL, SWAYAM, NPTEL, INFLIBNET, etc.

New arrivals data from Koha OPAC biblionumbers 33601-33649.

---

## Extending the App

### Add New Resource Category
1. Add to `LIRC_AFFILIATED_RESOURCES` in `src/data/libraryLinks.ts`
2. Auto-appears in LircResourcesScreen (searchable, collapsible)

### Add New Arrival Books
1. Add to `NEW_ARRIVALS_BOOKS` in `src/data/newArrivalsData.ts`
2. Auto-appears on Dashboard preview + NewArrivalsScreen

### Add New Screen
1. Create component in `src/screens/`
2. Add to `ScreenName` type in `DrawerNavigation.tsx`
3. Add import + route in `App.tsx`
4. Add nav button in `DrawerNavigation.tsx`

### Modify Storage
Edit `src/services/storage.ts` - all data operations centralized.

---

## Testing Checklist
- [ ] Login as student → see dashboard
- [ ] Toggle to admin → see approval desk, publish news
- [ ] Book discussion room → appears in admin for approval
- [ ] Approve booking → shows as approved for student
- [ ] View news clippings → PDF downloads work
- [ ] Check library stats → visits, hours, books
- [ ] Search Koha OPAC → shows books
- [ ] Browse LIRC Resources → all 10 categories expand, links open
- [ ] View New Arrivals → 14 books shown with Koha links
- [ ] Test on phone via network URL → responsive, touch-friendly

---

## Known Limitations (Demo/Offline)
- No real backend - all data in localStorage
- PDF "uploads" stored as base64 in localStorage (size limited)
- RFID gate simulation only (no hardware integration)
- Koha OPAC shows local mock data only
- No push notifications (marked "Coming Soon" in Settings)

---

## Handoff Notes for Next AI/Developer
1. **This is a complete, working student/admin library app**
2. **All requested changes implemented** (see commit history)
3. **Run `start.bat` for instant local+network access**
4. **To add real backend:** Replace `storage.ts` with API calls
5. **To integrate real Koha:** Connect `opacService.ts` to actual Koha REST API
6. **For production:** Add proper auth (OpenAthens/Shibboleth), HTTPS, CSP headers

---

## File Ownership Map
| Feature | Main Files |
|---------|-----------|
| Navigation | `DrawerNavigation.tsx`, `HeaderBar.tsx`, `App.tsx` |
| Student Dashboard | `StudentDashboard.tsx` |
| Room Booking | `DiscussionRoomScreen.tsx`, `AdminApprovalDesk.tsx` |
| News | `NewsClippingsScreen.tsx`, `AdminNewsPublish.tsx` |
| Stats | `LibraryStatsScreen.tsx` |
| Catalog | `OpacCatalogScreen.tsx`, `BookRequisitionScreen.tsx` |
| LIRC Info | `LircInfoScreen.tsx`, `LircResourcesScreen.tsx` |
| New Arrivals | `NewArrivalsScreen.tsx` |
| Data | `libraryLinks.ts`, `mockData.ts`, `newArrivalsData.ts` |
| Storage | `storage.ts` |
| Types | `types.ts` |

---

## Version
**Build 1.0.9** - Offline-First Student Library App for NIIT University LIRC