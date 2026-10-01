import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  onOpenDrawer: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onOpenDrawer
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0E0E10] text-white border-b border-[#8A151B]">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 rounded-lg hover:bg-[#1C1C1E] active:scale-95 transition-all text-gray-200"
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-white tracking-wide truncate max-w-[180px] sm:max-w-[240px]">
              {title}
            </h1>
          </div>
        </div>

      </div>
    </header>
  );
};