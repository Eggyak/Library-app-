import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';

const readJson = (filePath) => JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8'));
const books = readJson('scripts/nu_library_excel_books.json');
const appBooks = readJson('nu-library-app/src/data/excelCatalog.json');
const topicIndex = readJson('nu-library-app/src/data/topicBookIndex.json');
const booksById = new Map(books.map((book) => [book.id, book]));

assert.equal(books.length, appBooks.length, 'app catalog should contain the exported workbook inventory');
assert.equal(books.length, 1107, 'workbook title count changed; review extraction before accepting');

const isbnBook = books.find((book) => book.isbn);
assert.ok(isbnBook, 'workbook catalog should contain books with ISBNs');
const normalizedIsbn = isbnBook.isbn.replace(/[^0-9X]/gi, '').toUpperCase();
assert.ok(normalizedIsbn.length === 10 || normalizedIsbn.length === 13, 'selected workbook ISBN should be searchable');

for (const topic of topicIndex.topics) {
  assert.ok(topic.catalogRecommendations.length > 0, `${topic.topicName} should map to workbook books`);
  for (const recommendation of topic.catalogRecommendations) {
    assert.ok(booksById.has(recommendation.bookId), `${recommendation.bookId} must exist in workbook catalog`);
  }
}

const annotated = appBooks.filter((book) => book.topics?.length && book.strugglingWith?.length);
assert.ok(annotated.length > 0, 'recommended app books should include trained topic annotations');
assert.ok(appBooks.some((book) => book.isbns?.length > 1), 'duplicate-title copies should retain alternate ISBNs');
console.log(`Workbook integration passed: ${books.length} books, ${topicIndex.topics.length} topics, ${annotated.length} topic-annotated books.`);
