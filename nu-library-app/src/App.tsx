import React, { useState, useEffect } from 'react';
import { UserProfile, DiscussionRoomBooking, NewsClipping, IssuedBook, LibraryVisit, BookRequisition } from './types';
import { StorageService } from './services/storage';
import { HeaderBar } from './components/HeaderBar';
import { DrawerNavigation, ScreenName } from './components/DrawerNavigation';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavigation } from './components/BottomNavigation';
import { LoginScreen } from './screens/LoginScreen';
import { StudentDashboard } from './screens/StudentDashboard';
import { DiscussionRoomScreen } from './screens/DiscussionRoomScreen';
import { AdminApprovalDesk } from './screens/AdminApprovalDesk';
import { NewsClippingsScreen } from './screens/NewsClippingsScreen';
import { AdminNewsPublish } from './screens/AdminNewsPublish';
import { LibraryStatsScreen } from './screens/LibraryStatsScreen';
import { OpacCatalogScreen } from './screens/OpacCatalogScreen';
import { BookRequisitionScreen } from './screens/BookRequisitionScreen';
import { LircInfoScreen } from './screens/LircInfoScreen';
import { LircResourcesScreen } from './screens/LircResourcesScreen';
import { NewArrivalsScreen } from './screens/NewArrivalsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { isNfcFeatureAvailable } from './services/nfcCapability';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcCardEnabled, setNfcCardEnabled] = useState(StorageService.getNfcCardEnabled());

  // App domain state
  const [bookings, setBookings] = useState<DiscussionRoomBooking[]>([]);
  const [news, setNews] = useState<NewsClipping[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
  const [visits, setVisits] = useState<LibraryVisit[]>([]);
  const [requisitions, setRequisitions] = useState<BookRequisition[]>([]);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Load initial state
  useEffect(() => {
    setNfcSupported(isNfcFeatureAvailable());
    const user = StorageService.getCurrentUser();
    // Default to student if not explicitly logged out
    if (!user) {
      // Show login screen
      setCurrentUser(null);
    } else {
      setCurrentUser(user);
    }
    loadData();
  }, []);

  const loadData = () => {
    setBookings(StorageService.getBookings());
    setNews(StorageService.getNewsClippings());
    setIssuedBooks(StorageService.getIssuedBooks());
    setVisits(StorageService.getVisits());
    setRequisitions(StorageService.getRequisitions());
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveScreen('dashboard');
    loadData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setIsDrawerOpen(false);
  };

  const handleToggleRole = () => {
    if (!currentUser) return;
    if (currentUser.role === 'student') {
      const admin = StorageService.loginAsAdmin();
      setCurrentUser(admin);
    } else {
      const student = StorageService.loginAsStudent();
      setCurrentUser(student);
    }
    loadData();
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const getScreenTitle = (screen: ScreenName): string => {
    switch (screen) {
      case 'dashboard':
        return 'NU LIRC';
      case 'discussion_rooms':
        return 'Discussion Rooms';
      case 'admin_approvals':
        return 'Room Approval Desk';
      case 'news_clippings':
        return 'Daily News Clips';
      case 'admin_publish_news':
        return 'Publish Daily News';
      case 'library_stats':
        return 'Library Stats & Books';
      case 'opac_catalog':
        return 'Koha OPAC Search';
      case 'book_requisition':
        return 'Book Requisition';
      case 'timings':
        return 'LIRC Timetable';
      case 'rules':
        return 'General Rules';
      case 'lirc_resources':
        return 'LIRC e-Resources & Links';
      case 'new_arrivals':
        return 'New Arrivals';
      case 'settings':
        return 'Settings';
      default:
        return 'NIIT University';
    }
  };

  // If not logged in, render the LoginScreen inside MobileFrame
  if (!currentUser) {
    return (
      <MobileFrame>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <div className="flex h-full min-h-0 flex-col bg-[#0E0E10] relative text-white">
        {/* Top Header Bar */}
        <HeaderBar
          title={getScreenTitle(activeScreen)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />

        {/* Side Drawer Navigation */}
        <DrawerNavigation
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeScreen={activeScreen}
          onSelectScreen={(screen) => setActiveScreen(screen)}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingBookingsCount={pendingCount}
        />

        {/* Main Screen Body */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeScreen === 'dashboard' && (
            <StudentDashboard
              user={currentUser}
              nfcSupported={nfcSupported}
              nfcCardEnabled={nfcCardEnabled}
              bookings={bookings}
              news={news}
              issuedBooks={issuedBooks}
              visits={visits}
              onNavigate={(s, query) => {
                if (query !== undefined) setCatalogSearchQuery(query);
                setActiveScreen(s);
              }}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'discussion_rooms' && (
            <DiscussionRoomScreen
              user={currentUser}
              bookings={bookings}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'admin_approvals' && (
            <AdminApprovalDesk
              bookings={bookings}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'news_clippings' && (
            <NewsClippingsScreen
              news={news}
              currentUser={currentUser}
              onNavigateToPublish={() => setActiveScreen('admin_publish_news')}
            />
          )}

          {activeScreen === 'admin_publish_news' && (
            <AdminNewsPublish
              news={news}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'library_stats' && (
            <LibraryStatsScreen
              user={currentUser}
              issuedBooks={issuedBooks}
              visits={visits}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'opac_catalog' && (
            <OpacCatalogScreen
              initialQuery={catalogSearchQuery}
              onNavigateToRequisition={() => setActiveScreen('book_requisition')}
            />
          )}

          {activeScreen === 'book_requisition' && (
            <BookRequisitionScreen
              user={currentUser}
              requisitions={requisitions}
              onRefreshData={loadData}
            />
          )}

          {activeScreen === 'timings' && (
            <LircInfoScreen initialTab="timings" />
          )}

          {activeScreen === 'rules' && (
            <LircInfoScreen initialTab="rules" />
          )}

          {activeScreen === 'lirc_resources' && (
            <LircResourcesScreen />
          )}

          {activeScreen === 'new_arrivals' && (
            <NewArrivalsScreen onNavigate={(s) => setActiveScreen(s as any)} />
          )}

          {activeScreen === 'settings' && (
            <SettingsScreen
              currentUser={currentUser}
              nfcSupported={nfcSupported}
              nfcCardEnabled={nfcCardEnabled}
              onNfcCardEnabledChange={(enabled) => {
                StorageService.setNfcCardEnabled(enabled);
                setNfcCardEnabled(enabled);
              }}
              onToggleRole={handleToggleRole}
              onRefreshData={loadData}
              onLogout={handleLogout}
            />
          )}
        </main>

        <BottomNavigation
          activeScreen={activeScreen}
          onSelectScreen={(screen) => {
            setCatalogSearchQuery('');
            setActiveScreen(screen);
          }}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />
      </div>
    </MobileFrame>
  );
}

export default App;