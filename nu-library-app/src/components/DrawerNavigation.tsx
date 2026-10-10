import React from 'react';
import {
  Clock,
  Calendar,
  History,
  Settings,
  Newspaper,
  Search,
  PlusCircle,
  FileText,
  Shield,
  LayoutDashboard,
  Library,
  Sparkles,
  Globe,
  Users,
  MessageCircle
} from 'lucide-react';
import { UserProfile } from '../types';

export type ScreenName =
  | 'dashboard'
  | 'discussion_rooms'
  | 'news_clippings'
  | 'opac_catalog'
  | 'book_requisition'
  | 'timings'
  | 'rules'
  | 'lirc_resources'
  | 'new_arrivals'
  | 'feedback'
  | 'settings';

interface DrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ScreenName;
  onSelectScreen: (screen: ScreenName) => void;
  currentUser: UserProfile | null;
}

export const DrawerNavigation: React.FC<DrawerNavigationProps> = ({
  isOpen,
  onClose,
  activeScreen,
  onSelectScreen,
  currentUser,
}) => {
  if (!isOpen) return null;

  const handleSelect = (screen: ScreenName) => {
    onSelectScreen(screen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Drawer panel */}
      <div className="relative w-[300px] max-w-[85vw] h-full bg-[#121214] text-white flex flex-col z-10 shadow-2xl border-r border-[#242428]">
        {/* Header with Campus Banner */}
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-b from-[#8A151B] to-[#121214]">
          <img
            src="/assets/home_img_0.jpg"
            alt="NIIT University"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/universitybg.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-black/40" />

          {/* Title and user brief */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <img
                  src="/assets/logonobg.png"
                  alt="NU Logo"
                  className="w-7 h-7 object-contain drop-shadow"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <h2 className="text-lg font-bold tracking-wider text-white">
                  NIIT UNIVERSITY
                </h2>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 truncate">
                {currentUser?.name || 'NUton Member'} • {currentUser?.enrollmentNo}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {/* Main sections */}
           <button onClick={() => handleSelect('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'dashboard'
                ? 'bg-[#8A151B] text-white font-semibold shadow-md'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}>
            <LayoutDashboard className="w-5 h-5 text-red-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleSelect('discussion_rooms')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'discussion_rooms'
                ? 'bg-[#8A151B] text-white font-semibold'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Discussion Rooms</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
              Book
            </span>
          </button>

          <button
            onClick={() => handleSelect('news_clippings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'news_clippings'
                ? 'bg-[#8A151B] text-white font-semibold'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Newspaper className="w-5 h-5 text-blue-400" />
              <span>Daily News Clips</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
              PDF
            </span>
          </button>

          <button
            onClick={() => handleSelect('book_requisition')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'book_requisition'
                ? 'bg-[#8A151B] text-white font-semibold'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-pink-400" />
            <span>Book Requisition</span>
          </button>

          <button
            onClick={() => handleSelect('timings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'timings'
                ? 'bg-[#8A151B] text-white font-semibold'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5 text-orange-400" />
            <span>Timetable & Hours</span>
          </button>

          <button
            onClick={() => handleSelect('rules')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeScreen === 'rules'
                ? 'bg-[#8A151B] text-white font-semibold'
                : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 text-gray-400" />
            <span>General Rules</span>
          </button>

          {/* LIRC Resources Section */}
          <div className="pt-3 mt-2 border-t border-[#333338]">
            <div className="flex items-center space-x-1.5 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Library className="w-3.5 h-3.5" />
              <span>LIRC Resources</span>
            </div>

            <button
              onClick={() => handleSelect('lirc_resources')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeScreen === 'lirc_resources'
                  ? 'bg-[#8A151B] text-white font-semibold'
                  : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
              }`}
            >
              <Globe className="w-5 h-5 text-teal-400" />
              <span>All e-Resources & Links</span>
            </button>

            <button
              onClick={() => handleSelect('new_arrivals')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeScreen === 'new_arrivals'
                  ? 'bg-[#8A151B] text-white font-semibold'
                  : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span>New Arrivals</span>
            </button>
          </div>

          {/* Bottom Pinned Settings & Logout (Photo 9 style) */}
          <div className="border-t border-[#8A151B] p-3 space-y-1 bg-[#0E0E10]">
            <button
              onClick={() => handleSelect('feedback')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeScreen === 'feedback'
                  ? 'bg-[#8A151B] text-white font-semibold'
                  : 'text-gray-300 hover:bg-[#1C1C1E] hover:text-white'
              }`}
            >
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span>Feedback</span>
            </button>

            <button
              onClick={() => handleSelect('settings')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-[#1C1C1E] hover:text-white transition-all"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
