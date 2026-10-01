import { Book, SearchResultItem, SearchIntentType } from '../types';
import { StorageService } from './storage';
import { SemanticSearchService } from './semanticSearchService';

export const OpacService = {
  async search(query: string): Promise<{
    results: SearchResultItem[];
    books: Book[];
    isLive: boolean;
    detectedIntent: SearchIntentType;
  }> {
    const offlineCatalog = StorageService.getCatalog();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      const results: SearchResultItem[] = offlineCatalog.map(b => ({
        book: b,
        matchType: 'general',
        matchScore: 0,
        matchedTerms: []
      }));
      return { results, books: offlineCatalog, isLive: false, detectedIntent: 'general' };
    }

    // Try live Koha OPAC search via proxy or direct URL
    try {
      const url = `/koha-api/cgi-bin/koha/opac-search.pl?format=rss&q=${encodeURIComponent(cleanQuery)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const text = await resp.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');

        if (items.length > 0) {
          const liveBooks: Book[] = [];
          items.forEach((item, index) => {
            const title = item.querySelector('title')?.textContent?.trim() || 'Untitled Document';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const desc = item.querySelector('description')?.textContent?.trim() || '';
            const biblioMatch = link.match(/biblionumber=(\d+)/);
            const biblionumber = biblioMatch ? biblioMatch[1] : `live_${index}`;
            const isbnElem = item.querySelector('identifier') || item.querySelector('dc\\:identifier');
            const isbn = isbnElem?.textContent?.trim() || 'Available in Stacks';

            liveBooks.push({
              id: 'koha_' + biblionumber,
              biblionumber,
              title,
              author: 'NU Library Cataloged Author',
              isbn,
              callNumber: 'LIRC ' + (index + 1) * 100,
              stackLocation: 'Central Library Stack',
              copiesAvailable: 2,
              totalCopies: 4,
              category: 'Catalog Search Result',
              description: desc || 'Direct result from NIIT University Koha OPAC system.'
            });
          });

          // Run semantic intelligence over live results
          const semantic = SemanticSearchService.search(cleanQuery, liveBooks);
          return {
            results: semantic.results,
            books: semantic.results.map(r => r.book),
            isLive: true,
            detectedIntent: semantic.detectedIntent
          };
        }
      }
    } catch (err) {
      console.warn('Live OPAC query failed or offline, using local catalog fallback:', err);
    }

    // High-performance Semantic, Title, and ISBN Search on catalog
    const semantic = SemanticSearchService.search(cleanQuery, offlineCatalog);

    return {
      results: semantic.results,
      books: semantic.results.map(r => r.book),
      isLive: false,
      detectedIntent: semantic.detectedIntent
    };
  }
};