import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, FilterX, Globe, Search, Shield, RefreshCw } from 'lucide-react';
import { Api } from '../services/api';
import { EResourceItem } from '../types';

type ResourceCategory = { id: string; name: string };

export const LircResourcesScreen: React.FC = () => {
  const [resources, setResources] = useState<EResourceItem[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadResources = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [resourceResult, categoryResult] = await Promise.all([
        Api.getEResources(),
        Api.getEResourceCategories(),
      ]);
      const list = resourceResult.data?.items || [];
      const categoryList = categoryResult.data?.items || [];
      setResources(list);
      setCategories(categoryList);
      // New categories created in the staff portal open automatically when first received.
      setExpandedCategories(previous => {
        const next = new Set(previous);
        for (const category of categoryList) if (!previous.has(category.name)) next.add(category.name);
        for (const item of list) {
          const name = item.category || 'General e-Resources';
          if (!previous.has(name)) next.add(name);
        }
        return next;
      });
    } catch (err) {
      console.warn('Failed to load e-resources:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
    const handleUpdate = () => void loadResources(false);
    const handleResume = () => void loadResources(false);
    const poll = window.setInterval(() => void loadResources(false), 20000);
    window.addEventListener('lirc:realtime:e_resources', handleUpdate);
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('lirc:realtime:e_resources', handleUpdate);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [loadResources]);

  const groupedCategories = useMemo(() => {
    const categoryNames = new Set<string>(categories.map(category => category.name));
    for (const item of resources) categoryNames.add(item.category || 'General e-Resources');
    const query = searchQuery.trim().toLowerCase();
    return [...categoryNames].map(category => {
      const items = resources.filter(item => (item.category || 'General e-Resources') === category);
      const matching = items.filter(item => !query ||
        item.title.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query) ||
        category.toLowerCase().includes(query));
      return { category, items: matching };
    }).filter(group => !query ? true : group.items.length > 0 || group.category.toLowerCase().includes(query));
  }, [categories, resources, searchQuery]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(previous => {
      const next = new Set(previous);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  const openLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="min-h-full bg-[#0d0d0f] p-4 pb-24 text-white animate-fade-in">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-5 border-b border-[#7d1a1d] bg-[#101012] px-4 py-4">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-[#f16670]" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-wide">LIRC e-Resources &amp; Links</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">Library links, digital collections, and services</p>
          </div>
          <button onClick={() => void loadResources()} disabled={loading} aria-label="Refresh resources" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <input type="search" placeholder="Search resources, databases, links..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full rounded-2xl border border-[#37383f] bg-[#1b1b1e] py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-gray-500 focus:border-[#8e272b] focus:outline-none" />
        {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FilterX className="h-4 w-4" /></button>}
      </div>

      {loading && resources.length === 0 && categories.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#f16670]" />Loading library links…</div>
      ) : groupedCategories.length === 0 ? (
        <div className="rounded-2xl border border-[#29292d] bg-[#1b1b1e] py-12 text-center text-sm text-gray-400">No resources found.</div>
      ) : (
        <div className="space-y-3">
          {groupedCategories.map(({ category, items }) => {
            const expanded = expandedCategories.has(category);
            return <section key={category} className="overflow-hidden rounded-[24px] border border-[#303034] bg-[#1b1b1e] shadow-sm">
              <button onClick={() => toggleCategory(category)} aria-expanded={expanded} className="flex w-full items-center gap-3.5 px-4 py-4 text-left hover:bg-white/[0.025]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#32191c] text-[#f16670]"><ExternalLink className="h-6 w-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-5 text-gray-100">{category}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-400">{items.length ? `${items.length} ${items.length === 1 ? 'resource' : 'resources'} and library links` : 'Library resources and services'}</span>
                </span>
                {expanded ? <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" /> : <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />}
              </button>
              {expanded && items.length > 0 && <div className="border-t border-[#2b2b2f]">
                {items.map(item => <button key={item.id} onClick={() => openLink(item.url)} className="flex w-full items-start gap-3 border-b border-[#28282c] px-4 py-4 text-left last:border-b-0 hover:bg-white/[0.025]">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium leading-5 text-gray-100">{item.title}{item.requiresCampusNetwork && <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"><Shield className="h-3 w-3" />Campus Intranet</span>}</span>
                    {item.description && <span className="mt-1.5 block text-xs leading-5 text-gray-400">{item.description}</span>}
                  </span>
                  <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                </button>)}
              </div>}
            </section>;
          })}
        </div>
      )}
    </div>
  );
};
