import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile } from './types';
import { StorageService } from './services/storage';
import { Api, realtimeManager } from './services/api';
import { HeaderBar } from './components/HeaderBar';
import { DrawerNavigation, ScreenName } from './components/DrawerNavigation';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavigation } from './components/BottomNavigation';
import { StudentDashboard } from './screens/StudentDashboard';
import { DiscussionRoomScreen } from './screens/DiscussionRoomScreen';
import { NewsClippingsScreen } from './screens/NewsClippingsScreen';
import { OpacCatalogScreen } from './screens/OpacCatalogScreen';
import { BookRequisitionScreen } from './screens/BookRequisitionScreen';
import { LircInfoScreen } from './screens/LircInfoScreen';
import { LircResourcesScreen } from './screens/LircResourcesScreen';
import { NewArrivalsScreen } from './screens/NewArrivalsScreen';
import { FeedbackFormScreen } from './screens/FeedbackFormScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DiscussionRoomErrorBoundary } from './components/DiscussionRoomErrorBoundary';
import { isNfcFeatureAvailable } from './services/nfcCapability';
import { WifiOff } from 'lucide-react';

export function App() {
  const [currentUser] = useState<UserProfile>({ id: 'guest', name: 'NUton Member', email: '', role: 'guest', enrollmentNo: '' });
  const [activeScreen, setActiveScreen] = useState<ScreenName>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcCardEnabled, setNfcCardEnabled] = useState(StorageService.getNfcCardEnabled());
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const mainScrollRef = useRef<{ scrollOffset: number; lastScrollY: number }>({ scrollOffset: 0, lastScrollY: 0 });

  const handleMainScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - mainScrollRef.current.lastScrollY;
    mainScrollRef.current.lastScrollY = currentScrollY;

    if (delta > 5 && bottomNavVisible) {
      setBottomNavVisible(false);
    } else if (delta < -5 && !bottomNavVisible) {
      setBottomNavVisible(true);
    }
    mainScrollRef.current.scrollOffset = currentScrollY;
  }, [bottomNavVisible]);

  useEffect(() => {
    setNfcSupported(isNfcFeatureAvailable());
    StorageService.logout();

    realtimeManager.start();

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('lirc:offline', handleOffline);
    window.addEventListener('lirc:online', handleOnline);
    window.addEventListener('scroll', handleMainScroll, { passive: true });

    return () => {
      window.removeEventListener('lirc:offline', handleOffline);
      window.removeEventListener('lirc:online', handleOnline);
      window.removeEventListener('scroll', handleMainScroll);
      realtimeManager.stop();
    };
  }, [handleMainScroll]);

  const getScreenTitle = (screen: ScreenName): string => {
    switch (screen) {
      case 'dashboard':
        return 'NU LIRC';
      case 'discussion_rooms':
        return 'Discussion Rooms';
      case 'news_clippings':
        return 'Daily News Clips';
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
      case 'feedback':
        return 'Feedback';
      case 'settings':
        return 'Settings';
      default:
        return 'NIIT University';
    }
  };

  return (
    <MobileFrame>
      <div className="flex h-full min-h-0 flex-col bg-[#0E0E10] relative text-white" style={{
        paddingTop: 'max(0px, env(safe-area-inset-top))',
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingRight: 'max(0px, env(safe-area-inset-right))'
      }}>
        {/* Offline notification banner if laptop server is unreachable */}
        {isOffline && (
          <div className="bg-amber-600/90 text-white text-[11px] px-3 py-1.5 flex items-center justify-between z-40">
            <div className="flex items-center space-x-1.5">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Offline mode — Trying to reach library server...</span>
            </div>
            <button
              onClick={() => {
                Api.getHealth().then(() => setIsOffline(false)).catch(() => {});
              }}
              className="underline text-[10px] font-semibold hover:text-amber-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Header Bar with 7-tap server settings modal */}
        <HeaderBar
          title={getScreenTitle(activeScreen)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onServerUrlChanged={() => {
            realtimeManager.start();
          }}
        />

        {/* Side Drawer Navigation */}
        <DrawerNavigation
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeScreen={activeScreen}
          onSelectScreen={(screen) => setActiveScreen(screen)}
          currentUser={currentUser}
        />

        {/* Main Screen Body */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeScreen === 'dashboard' && (
            <StudentDashboard
              user={currentUser}
              nfcSupported={nfcSupported}
              nfcCardEnabled={nfcCardEnabled}
              onNavigate={(s, query) => {
                if (query !== undefined) setCatalogSearchQuery(query);
                setActiveScreen(s);
              }}
            />
          )}

           {activeScreen === 'discussion_rooms' && (
             <DiscussionRoomErrorBoundary>
               <DiscussionRoomScreen user={currentUser} />
             </DiscussionRoomErrorBoundary>
           )}

           {activeScreen === 'news_clippings' && (
             <NewsClippingsScreen
               currentUser={currentUser}
             />
           )}

           {activeScreen === 'opac_catalog' && (
             <OpacCatalogScreen
               initialQuery={catalogSearchQuery}
               onNavigateToRequisition={() => setActiveScreen('book_requisition')}
             />
           )}

           {activeScreen === 'book_requisition' && (
             <BookRequisitionScreen user={currentUser} />
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

           {activeScreen === 'feedback' && (
             <FeedbackFormScreen user={currentUser} />
           )}

           {activeScreen === 'settings' && (
            <SettingsScreen
              nfcSupported={nfcSupported}
              nfcCardEnabled={nfcCardEnabled}
              onNfcCardEnabledChange={(enabled) => {
                StorageService.setNfcCardEnabled(enabled);
                setNfcCardEnabled(enabled);
              }}
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
          visible={bottomNavVisible}
        />
      </div>
    </MobileFrame>
  );
}

export default App;
