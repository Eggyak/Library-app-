import { Book, SearchResultItem, SearchIntentType } from '../types';

// Conversational filler phrases commonly typed by students
const STOP_PHRASES = [
  'i am unable to understand',
  'i cannot understand',
  'i can\'t understand',
  'i dont understand',
  'i don\'t understand',
  'unable to understand',
  'how to understand',
  'want to learn',
  'i want to learn',
  'how to learn',
  'how do i learn',
  'explain to me',
  'explain',
  'books for',
  'book for',
  'books on',
  'book on',
  'which book should i read for',
  'which book for',
  'what is the best book for',
  'tell me about',
  'concept of',
  'concepts of',
  'what is',
  'how does',
  'how do',
  'help with',
  'study material for',
  'guide for'
];

/**
 * Normalizes an ISBN string by stripping hyphens, spaces, and prefix markers.
 */
export function cleanIsbn(str: string): string {
  return str.replace(/isbn(?:-1[03])?:?\s*/i, '').replace(/[-\s]/g, '').trim().toUpperCase();
}

/**
 * Checks if a string looks like an ISBN (10 or 13 characters with digits or ends in X).
 */
export function isLikelyIsbn(str: string): boolean {
  const cleaned = cleanIsbn(str);
  if (/^(?:978|979)?\d{9}[\dX]$/i.test(cleaned)) {
    return true;
  }
  // Check if at least 7 contiguous digits entered (partial ISBN search)
  return /^\d{7,13}$/.test(cleaned);
}

/**
 * Cleans conversational fluff from a student's topic query.
 * Example: "I am unable to understand deadlocks" -> "deadlocks"
 */
export function extractCoreTopicQuery(rawQuery: string): string {
  let cleaned = rawQuery.trim().toLowerCase();

  for (const phrase of STOP_PHRASES) {
    if (cleaned.startsWith(phrase)) {
      cleaned = cleaned.slice(phrase.length).trim();
    }
  }

  // Also remove trailing question marks or punctuation
  cleaned = cleaned.replace(/[?!.,;:]+$/, '').trim();
  return cleaned || rawQuery.trim().toLowerCase();
}

function uniqueBookResults(results: SearchResultItem[]): SearchResultItem[] {
  const unique = new Map<string, SearchResultItem>();
  for (const result of [...results].sort((a, b) => b.matchScore - a.matchScore)) {
    const titleKey = result.book.title
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/[\p{P}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!unique.has(titleKey)) unique.set(titleKey, result);
  }
  return Array.from(unique.values());
}

export const SemanticSearchService = {
  /**
   * Main multi-intent search function.
   * Handles ISBN, Title/Author, and Topic Recommendation queries in the same search bar.
   */
  search(query: string, catalog: Book[]): { results: SearchResultItem[]; detectedIntent: SearchIntentType } {
    const raw = query.trim();
    if (!raw) {
      return {
        results: uniqueBookResults(catalog.map(b => ({
          book: b,
          matchType: 'general',
          matchScore: 0,
          matchedTerms: []
        }))),
        detectedIntent: 'general'
      };
    }

    const cleanedIsbnQuery = cleanIsbn(raw);
    const isIsbnQuery = isLikelyIsbn(raw);

    // ==========================================
    // 1. ISBN SEARCH (Exact & Prefix Match)
    // ==========================================
    if (isIsbnQuery) {
      const isbnMatches: SearchResultItem[] = [];
      for (const book of catalog) {
        const bookIsbns = Array.from(new Set([book.isbn, ...(book.isbns || [])]
          .filter(Boolean)
          .map(cleanIsbn)));
        const exactIsbn = bookIsbns.find(isbn => isbn === cleanedIsbnQuery);
        const partialIsbn = bookIsbns.find(isbn => isbn.includes(cleanedIsbnQuery));
        if (exactIsbn) {
          isbnMatches.push({
            book,
            matchType: 'isbn',
            matchScore: 100,
            matchedTerms: [exactIsbn],
            recommendationReason: `Exact ISBN Match in NIIT University LIRC Collection (${exactIsbn})`
          });
        } else if (partialIsbn) {
          isbnMatches.push({
            book,
            matchType: 'isbn',
            matchScore: 85,
            matchedTerms: [partialIsbn],
            recommendationReason: `Partial ISBN Match (${partialIsbn})`
          });
        }
      }

      if (isbnMatches.length > 0) {
        return {
          results: uniqueBookResults(isbnMatches),
          detectedIntent: 'isbn'
        };
      }
    }

    // ==========================================
    // 2. TITLE / AUTHOR DIRECT SEARCH
    // ==========================================
    const lowerQuery = raw.toLowerCase();
    const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 1);

    const titleMatches: SearchResultItem[] = [];
    for (const book of catalog) {
      const titleLower = book.title.toLowerCase();
      const authorLower = book.author.toLowerCase();
      let score = 0;
      const matchedTerms: string[] = [];

      // Check Acronyms (e.g. "CLRS" -> Cormen Leiserson Rivest Stein)
      if (lowerQuery === 'clrs' && titleLower.includes('clrs')) {
        score = 100;
        matchedTerms.push('CLRS');
      } else if (titleLower === lowerQuery) {
        score = 100;
        matchedTerms.push(book.title);
      } else if (titleLower.includes(lowerQuery)) {
        score = 85;
        matchedTerms.push(lowerQuery);
      } else if (authorLower.includes(lowerQuery)) {
        score = 80;
        matchedTerms.push(book.author);
      } else {
        // Token overlap in title / author
        const titleTokenHits = queryTokens.filter(t => titleLower.includes(t));
        const authorTokenHits = queryTokens.filter(t => authorLower.includes(t));
        if (titleTokenHits.length > 0 || authorTokenHits.length > 0) {
          score = (titleTokenHits.length * 20) + (authorTokenHits.length * 15);
          matchedTerms.push(...titleTokenHits, ...authorTokenHits);
        }
      }

      if (score >= 40) {
        titleMatches.push({
          book,
          matchType: authorLower.includes(lowerQuery) ? 'author' : 'title',
          matchScore: score,
          matchedTerms,
          recommendationReason: score >= 80 ? `Direct Catalog Match for "${raw}"` : `Matches keywords in book title & author`
        });
      }
    }

    const directMatches = titleMatches.filter(match => match.matchScore >= 80);
    if (directMatches.length > 0) {
      return {
        results: uniqueBookResults(directMatches),
        detectedIntent: directMatches[0].matchType === 'author' ? 'author' : 'title'
      };
    }

    // ==========================================
    // 3. TOPIC & CONCEPT RECOMMENDATION SEARCH
    // ==========================================
    const coreTopic = extractCoreTopicQuery(raw);
    const topicTokens = coreTopic.split(/\s+/).filter(t => t.length > 1);
    const topicMatches: SearchResultItem[] = [];

    for (const book of catalog) {
      let topicScore = 0;
      const matchedTerms: string[] = [];
      let bestChapter: string | undefined;
      let bestChapterDesc: string | undefined;

      const topics = book.topics || [];
      const keyConcepts = book.keyConcepts || [];
      const struggling = book.strugglingWith || [];
      const chapters = book.recommendedChapters || [];
      const descLower = (book.description || '').toLowerCase();

      // Check exact topic match
      for (const t of topics) {
        const tLower = t.toLowerCase();
        if (tLower === coreTopic) {
          topicScore += 50;
          matchedTerms.push(t);
        } else if (tLower.includes(coreTopic) || (coreTopic.length > 3 && coreTopic.includes(tLower))) {
          topicScore += 30;
          matchedTerms.push(t);
        } else {
          // Token overlap
          const hits = topicTokens.filter(token => tLower.includes(token));
          if (hits.length > 0) {
            topicScore += hits.length * 8;
            matchedTerms.push(...hits);
          }
        }
      }

      // Check key concepts
      for (const kc of keyConcepts) {
        const kcLower = kc.toLowerCase();
        if (kcLower.includes(coreTopic)) {
          topicScore += 35;
          matchedTerms.push(kc);
        } else {
          const hits = topicTokens.filter(token => kcLower.includes(token));
          if (hits.length > 0) {
            topicScore += hits.length * 10;
            matchedTerms.push(kc);
          }
        }
      }

      // Check student pain points (strugglingWith)
      for (const sw of struggling) {
        const swLower = sw.toLowerCase();
        if (swLower.includes(coreTopic)) {
          topicScore += 40;
          matchedTerms.push('Student Pain Point Alignment');
        } else {
          const hits = topicTokens.filter(token => swLower.includes(token));
          if (hits.length > 0) {
            topicScore += hits.length * 8;
          }
        }
      }

      // Check recommended chapters
      for (const ch of chapters) {
        const chText = `${ch.chapter} ${ch.title} ${(ch.topics || []).join(' ')}`.toLowerCase();
        if (chText.includes(coreTopic) || topicTokens.some(t => chText.includes(t))) {
          topicScore += 25;
          if (!bestChapter) {
            bestChapter = `${ch.chapter}: ${ch.title}`;
            bestChapterDesc = (ch.topics || []).slice(0, 3).join(', ');
          }
        }
      }

      // Check book description
      if (descLower.includes(coreTopic)) {
        topicScore += 20;
      }

      if (topicScore > 15) {
        const cleanMatchedTerms = Array.from(new Set(matchedTerms)).slice(0, 3);
        const reason = bestChapter
          ? `Recommended for "${coreTopic}": Detailed in ${bestChapter}${bestChapterDesc ? ` (${bestChapterDesc})` : ''}`
          : `Recommended for "${coreTopic}": Covers fundamental concepts & syllabus requirements`;

        topicMatches.push({
          book,
          matchType: 'topic',
          matchScore: topicScore,
          matchedTerms: cleanMatchedTerms,
          recommendationReason: reason,
          relevantChapter: bestChapter
        });
      }
    }

    // ==========================================
    // COMBINE & SELECT PRIMARY INTENT
    // ==========================================
    const allCandidates = new Map<string, SearchResultItem>();

    // If strong topic match exists
    const topTopicScore = topicMatches.length > 0 ? Math.max(...topicMatches.map(m => m.matchScore)) : 0;
    const topTitleScore = titleMatches.length > 0 ? Math.max(...titleMatches.map(m => m.matchScore)) : 0;

    // Classify primary intent
    let detectedIntent: SearchIntentType = 'topic';
    if (topTitleScore > topTopicScore && topTitleScore >= 80) {
      detectedIntent = 'title';
    } else if (topTopicScore > 0) {
      detectedIntent = 'topic';
    } else if (topTitleScore > 0) {
      detectedIntent = 'title';
    } else {
      detectedIntent = 'general';
    }

    // Merge without duplicates, prioritizing highest score
    for (const item of [...topicMatches, ...titleMatches]) {
      const existing = allCandidates.get(item.book.id);
      if (!existing || item.matchScore > existing.matchScore) {
        allCandidates.set(item.book.id, item);
      }
    }

    const sortedResults = Array.from(allCandidates.values()).sort((a, b) => b.matchScore - a.matchScore);

    // If nothing matched, provide fallback substring search
    if (sortedResults.length === 0) {
      const fallback = catalog.filter(b =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.author.toLowerCase().includes(lowerQuery) ||
        b.category.toLowerCase().includes(lowerQuery) ||
        (b.description || '').toLowerCase().includes(lowerQuery)
      ).map(b => ({
        book: b,
        matchType: 'general' as SearchIntentType,
        matchScore: 20,
        matchedTerms: [raw]
      }));

      return {
        results: uniqueBookResults(fallback),
        detectedIntent: 'general'
      };
    }

    return {
      results: uniqueBookResults(sortedResults),
      detectedIntent
    };
  }
};
