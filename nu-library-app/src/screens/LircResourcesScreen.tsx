import React, { useState } from 'react';
import { ExternalLink, ChevronRight, Search, FilterX } from 'lucide-react';
import { LIRC_AFFILIATED_RESOURCES, LibraryLinkCategory, LibraryLinkItem } from '../data/libraryLinks';

export const LircResourcesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filteredCategories = LIRC_AFFILIATED_RESOURCES.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      category.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isExpanded = (categoryName: string) => expandedCategories.has(categoryName);

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search resources, databases, links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1C1C1E] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8A151B]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            aria-label="Clear search"
          >
            <FilterX className="w-5 h-5" />
          </button>
        )}
      </div>

      {searchQuery && (
        <p className="text-xs text-gray-400 px-1">
          Showing results for "{searchQuery}"
        </p>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {filteredCategories.map((category) => (
          <div key={category.category} className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C30] overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#8A151B]/20 text-red-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{category.category}</h3>
                  {category.description && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{category.description}</p>
                  )}
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded(category.category) ? 'rotate-90' : ''}`}
              />
            </button>

            {/* Category Items */}
            {isExpanded(category.category) && (
              <div className="border-t border-[#2C2C30] divide-y divide-[#242428]">
                {category.items.map((item, index) => (
                  <button
                    key={`${category.category}-${index}`}
                    onClick={() => openLink(item.url)}
                    className="w-full p-4 flex items-start justify-between space-x-3 hover:bg-[#242428] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white text-sm truncate">{item.title}</h4>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600/30 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-500 shrink-0 mt-0.5 hover:text-red-400 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 px-4 rounded-3xl bg-[#1C1C1E] border border-gray-800 space-y-3">
            <Search className="w-10 h-10 text-gray-500 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-300">No Resources Found</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Try adjusting your search terms or browse all categories.
            </p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="pt-4 border-t border-[#2C2C30] p-3 rounded-2xl bg-[#121214] border-[#333338] text-[11px] text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300">Note:</p>
        <p>Links marked <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600/30 text-amber-300 border border-amber-500/30">Campus Intranet</span> or <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600/30 text-amber-300 border border-amber-500/30">Drive Archive</span> require campus network or VPN access.</p>
        <p>For remote access to subscribed databases (EBSCO, IEEE, JSTOR, etc.), use the <strong>INFED - Shibboleth</strong> link under <strong>LIRC@Remote Access & Networks</strong>.</p>
        <p className="pt-2 border-t border-[#2C2C30]">Maintained by LIRC, NIIT University. Last updated: Sep 2026.</p>
      </div>
    </div>
  );
};