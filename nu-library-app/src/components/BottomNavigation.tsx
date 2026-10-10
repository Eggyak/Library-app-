import React from 'react';
import { Bot, Files, LayoutDashboard, Menu, Search } from 'lucide-react';
import { ScreenName } from './DrawerNavigation';

interface BottomNavigationProps {
  activeScreen: ScreenName;
  onSelectScreen: (screen: ScreenName) => void;
  onOpenMenu: () => void;
  visible?: boolean;
}

const primaryScreens: { screen: ScreenName; label: string; icon: typeof LayoutDashboard }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { screen: 'opac_catalog', label: 'Koha OPAC Search', icon: Search },
  { screen: 'lirc_resources', label: 'All e-Resources', icon: Files }
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeScreen,
  onSelectScreen,
  onOpenMenu,
  visible = true,
}) => (
  <nav
    aria-label="Main navigation"
    className={`relative z-30 shrink-0 border-t border-[#8A151B] bg-[#09090b] transition-all duration-300 ease-in-out ${
      visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
    }`}
    style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
  >
    <div className="grid h-[46px] grid-cols-5 items-center">
      {primaryScreens.slice(0, 2).map(({ screen, label, icon: Icon }) => (
        <button
          key={screen}
          type="button"
          onClick={() => onSelectScreen(screen)}
          aria-label={label}
          aria-current={activeScreen === screen ? 'page' : undefined}
          title={label}
          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            activeScreen === screen ? 'text-white' : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          <Icon className="h-6 w-6" strokeWidth={2.5} />
        </button>
      ))}

      <button
        type="button"
        disabled
        aria-label="Chatbot coming soon"
        title="Chatbot coming soon"
        className="relative z-10 mx-auto -mt-6 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#09090b] bg-[#A4141D] text-[#12090a] shadow-[0_0_0_1px_#8A151B] disabled:cursor-not-allowed"
      >
        <Bot className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={() => onSelectScreen('lirc_resources')}
        aria-label="All e-Resources"
        aria-current={activeScreen === 'lirc_resources' ? 'page' : undefined}
        title="All e-Resources"
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
          activeScreen === 'lirc_resources' ? 'text-white' : 'text-gray-500 hover:text-gray-200'
        }`}
      >
        <Files className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        title="Open menu"
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:text-gray-200"
      >
        <Menu className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </div>
  </nav>
);