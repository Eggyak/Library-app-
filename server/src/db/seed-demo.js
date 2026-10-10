/**
 * Demo data seed script
 * Populates sample library data for demonstrations
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { seedDatabase } from './seed.js';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = resolve(__dirname, '../data/library.db');

const SAMPLE_BOOKS = [
  {
    isbn: '9780262033844',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    category: 'Computer Science',
    shelf_location: 'CS-101',
    qty: 5,
    publisher: 'MIT Press',
    year: 2022,
    description: 'A comprehensive introduction to algorithms, data structures, and algorithm analysis.'
  },
  {
    isbn: '9780123456789',
    title: 'Machine Learning Yearning',
    author: 'Andrew Ng',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-205',
    qty: 3,
    publisher: 'Independently Published',
    year: 2018,
    description: 'A guide to machine learning methodology and best practices.'
  },
  {
    isbn: '9780521670234',
    title: 'Pattern Recognition and Machine Learning',
    author: 'Christopher Bishop',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-210',
    qty: 4,
    publisher: 'Springer',
    year: 2006,
    description: 'Covers Bayesian methods, graphical models, and neural networks.'
  },
  {
    isbn: '9780134494166',
    title: 'Operating System Concepts',
    author: 'Abraham Silberschatz',
    category: 'Computer Science',
    shelf_location: 'CS-102',
    qty: 6,
    publisher: 'Wiley',
    year: 2018,
    description: 'Comprehensive overview of operating system concepts, design, and implementation.'
  },
  {
    isbn: '9780201633610',
    title: 'Design Patterns',
    author: 'Erich Gamma',
    category: 'Software Engineering',
    shelf_location: 'SE-301',
    qty: 4,
    publisher: 'Addison-Wesley',
    year: 1994,
    description: 'Classic patterns and solutions for common object-oriented design problems.'
  },
  {
    isbn: '9780073525365',
    title: 'Database Solutions',
    author: 'Hector Garcia-Molina',
    category: 'Computer Science',
    shelf_location: 'CS-103',
    qty: 3,
    publisher: 'Pearson',
    year: 2020,
    description: 'Design patterns for database systems and applications.'
  },
  {
    isbn: '9780262133613',
    title: 'The Art of Computer Programming',
    author: 'Donald Knuth',
    category: 'Computer Science',
    shelf_location: 'CS-104',
    qty: 2,
    publisher: 'Addison-Wesley',
    year: 2011,
    description: 'Fundamental algorithms, seminumerical algorithms, and mathematical preliminaries.'
  },
  {
    isbn: '9780134773726',
    title: 'Clean Architecture',
    author: 'Robert Martin',
    category: 'Software Engineering',
    shelf_location: 'SE-302',
    qty: 5,
    publisher: 'Pearson',
    year: 2017,
    description: 'Software architecture principles, patterns, and practices.'
  },
  {
    isbn: '9780134093410',
    title: 'Refactoring',
    author: 'Martin Fowler',
    category: 'Software Engineering',
    shelf_location: 'SE-303',
    qty: 4,
    publisher: 'Addison-Wesley',
    year: 2018,
    description: 'Improving the design of existing code through refactoring techniques.'
  },
  {
    isbn: '9780134685970',
    title: 'The Web Application Hacker Toolkit',
    author: 'Dafydd Stuttard',
    category: 'Cybersecurity',
    shelf_location: 'CYB-401',
    qty: 3,
    publisher: 'Wiley',
    year: 2020,
    description: 'Tools and techniques for web application security testing.'
  },
  {
    isbn: '9781593278281',
    title: 'The Linux Command Line',
    author: 'William Shotts',
    category: 'Linux',
    shelf_location: 'LIN-001',
    qty: 4,
    publisher: 'No Starch Press',
    year: 2019,
    description: 'A complete introduction to the Linux command line and shell scripting.'
  },
  {
    isbn: '9780133591415',
    title: 'Java: The Complete Reference',
    author: 'Herbert Schildt',
    category: 'Java',
    shelf_location: 'JAVA-001',
    qty: 3,
    publisher: 'McGraw-Hill',
    year: 2021,
    description: 'Comprehensive guide to Java programming language and core APIs.'
  },
  {
    isbn: '9780596008653',
    title: 'Java Performance Tuning',
    author: 'Jack Shirazi',
    category: 'Java',
    shelf_location: 'JAVA-002',
    qty: 2,
    publisher: 'O Reilly',
    year: 2018,
    description: 'Techniques for optimizing Java application performance.'
  },
  {
    isbn: '9781109871973',
    title: 'The Psychology of Computer Programming',
    author: 'Gerald Weinberg',
    category: 'Psychology',
    shelf_location: 'PSY-001',
    qty: 2,
    publisher: 'Dorset House',
    year: 1999,
    description: 'Seminal work on the human side of software development.'
  },
  {
    isbn: '9781118766584',
    title: 'Computer Organization and Architecture',
    author: 'William Stallings',
    category: 'Computer Architecture',
    shelf_location: 'ARCH-001',
    qty: 4,
    publisher: 'Pearson',
    year: 2019,
    description: 'Fundamentals of computer systems design and architecture.'
  },
  {
    isbn: '9780134997835',
    title: 'Cloud Computing Concepts',
    author: 'Indranil Gupta',
    category: 'Cloud Computing',
    shelf_location: 'CLOUD-001',
    qty: 3,
    publisher: 'Pearson',
    year: 2019,
    description: 'Principles and paradigms of cloud computing systems and applications.'
  },
  {
    isbn: '9781491901434',
    title: 'Data Science from Scratch',
    author: 'Joel Grus',
    category: 'Data Science',
    shelf_location: 'DS-001',
    qty: 3,
    publisher: 'O Reilly',
    year: 2019,
    description: 'Data science fundamentals using Python with practical examples.'
  },
  {
    isbn: '9780134734026',
    title: 'DevOps Handbook',
    author: 'Gene Kim',
    category: 'DevOps',
    shelf_location: 'DEVOPS-001',
    qty: 3,
    publisher: 'IT Revolution Press',
    year: 2016,
    description: 'Creating world-class agility, reliability, and security.'
  },
  {
    isbn: '9780393911050',
    title: 'The Selfish Gene',
    author: 'Richard Dawkins',
    category: 'Evolutionary Biology',
    shelf_location: 'EBIO-001',
    qty: 3,
    publisher: 'Oxford University Press',
    year: 2016,
    description: 'The seminal work on evolutionary biology and gene-centered selection.'
  },
  {
    isbn: '9780226283732',
    title: 'The Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson',
    category: 'Computer Science',
    shelf_location: 'CS-105',
    qty: 4,
    publisher: 'MIT Press',
    year: 2023,
    description: 'Foundational text on computer science and programming methodology.'
  },
  {
    isbn: '9780134494166',
    title: 'Python Crash Course',
    author: 'Eric Matthes',
    category: 'Python',
    shelf_location: 'PY-001',
    qty: 5,
    publisher: 'No Starch Press',
    year: 2019,
    description: 'A thorough introduction to Python programming and project development.'
  },
  {
    isbn: '9780596516400',
    title: 'Natural Language Processing',
    author: 'Jurafsky & Martin',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-220',
    qty: 3,
    publisher: 'O Reilly',
    year: 2023,
    description: 'Comprehensive guide to NLP algorithms and techniques.'
  },
  {
    isbn: '9781119553407',
    title: 'Python for Data Science',
    author: 'Kenneth D. Pazzi',
    category: 'Data Science',
    shelf_location: 'DS-002',
    qty: 2,
    publisher: 'Wiley',
    year: 2022,
    description: 'Python tools and techniques for data analysis and visualization.'
  },
  {
    isbn: '9780201608425',
    title: 'The Mythical Man-Month',
    author: 'Frederick Brooks',
    category: 'Software Engineering',
    shelf_location: 'SE-304',
    qty: 3,
    publisher: 'Addison-Wesley',
    year: 1995,
    description: 'Essays on software engineering and project management.'
  },
  {
    isbn: '9781617294056',
    title: 'Seven Databases in Seven Weeks',
    author: 'Eric Redmond',
    category: 'Database',
    shelf_location: 'DB-001',
    qty: 2,
    publisher: 'Pragmatic Bookshelf',
    year: 2018,
    description: 'Exploration of seven different database engines in depth.'
  },
  {
    isbn: '9780321573802',
    title: 'Effective C++',
    author: 'Scott Meyers',
    category: 'C++',
    shelf_location: 'CPP-001',
    qty: 3,
    publisher: 'Addison-Wesley',
    year: 2014,
    description: 'Specific ways to improve programs and library packages.'
  },
  {
    isbn: '9781449327795',
    title: 'The Go Programming Language',
    author: 'Alan Donovan',
    category: 'Go',
    shelf_location: 'GO-001',
    qty: 2,
    publisher: 'Addison-Wesley',
    year: 2015,
    description: 'Comprehensive guide to the Go programming language and its idioms.'
  },
  {
    isbn: '9780134840378',
    title: 'Rust Programming',
    author: 'Jim Blandy',
    category: 'Rust',
    shelf_location: 'RUST-001',
    qty: 2,
    publisher: 'O Reilly',
    year: 2022,
    description: 'Introduction to systems programming with Rust.'
  },
  {
    isbn: '9781491938125',
    title: 'Kubernetes Up & Running',
    author: 'Burns & Beda',
    category: 'Cloud Computing',
    shelf_location: 'CLOUD-002',
    qty: 3,
    publisher: 'O Reilly',
    year: 2022,
    description: 'Distributed systems with containers and Kubernetes.'
  },
  {
    isbn: '9780134685970',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-230',
    qty: 4,
    publisher: 'Pearson',
    year: 2021,
    description: 'Comprehensive introduction to AI theory and practice.'
  },
  {
    isbn: '9780070380765',
    title: 'Signals and Systems',
    author: 'Alan Oppenheim',
    category: 'Signal Processing',
    shelf_location: 'SP-001',
    qty: 3,
    publisher: 'Prentice Hall',
    year: 2019,
    description: 'Fundamental principles of signal and system analysis.'
  },
  {
    isbn: '9780321831074',
    title: 'Digital Signal Processing',
    author: 'John Proakis',
    category: 'Signal Processing',
    shelf_location: 'SP-002',
    qty: 2,
    publisher: 'Pearson',
    year: 2019,
    description: 'Comprehensive treatment of digital signal processing techniques.'
  },
  {
    isbn: '9780262028685',
    title: 'Machine Vision',
    author: 'Hinrich',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-240',
    qty: 2,
    publisher: 'MIT Press',
    year: 2022,
    description: 'Algorithms and applications for computer vision.'
  },
  {
    isbn: '9780134301727',
    title: 'Computer Graphics',
    author: 'Foley & Van Dam',
    category: 'Graphics',
    shelf_location: 'GRAPHICS-001',
    qty: 3,
    publisher: 'Pearson',
    year: 2019,
    description: 'Fundamentals of computer graphics and rendering.'
  },
  {
    isbn: '9780262019860',
    title: 'Human Compatible',
    author: 'Stuart Russell',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-250',
    qty: 3,
    publisher: 'Viking',
    year: 2019,
    description: 'Artificial intelligence and the problem of control.'
  },
  {
    isbn: '9780226457852',
    title: 'The Innovator Dilemma',
    author: 'Clayton Christensen',
    category: 'Business',
    shelf_location: 'BUS-001',
    qty: 4,
    publisher: 'Harvard Business Review Press',
    year: 2015,
    description: 'Why good companies can fail and what to do about it.'
  },
  {
    isbn: '9780134662728',
    title: 'The First 90 Days',
    author: 'Michael Watkins',
    category: 'Business',
    shelf_location: 'BUS-002',
    qty: 3,
    publisher: 'Harvard Business Review Press',
    year: 2023,
    description: 'Proven strategies for surviving and thriving in new roles.'
  },
  {
    isbn: '9780262042555',
    title: 'Strategic Game Theory',
    author: 'Avital',
    category: 'Game Theory',
    shelf_location: 'GT-001',
    qty: 2,
    publisher: 'MIT Press',
    year: 2020,
    description: 'Advanced game theory concepts and applications.'
  },
  {
    isbn: '9780134958138',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'Business',
    shelf_location: 'BUS-003',
    qty: 4,
    publisher: 'Crown Business',
    year: 2011,
    description: 'Build-Measure-Learn methodology for startups.'
  },
  {
    isbn: '9780134760278',
    title: 'Deep Learning',
    author: 'Ian Goodfellow',
    category: 'Artificial Intelligence',
    shelf_location: 'AI-260',
    qty: 3,
    publisher: 'MIT Press',
    year: 2016,
    description: 'Comprehensive introduction to deep learning theory and practice.'
  },
  {
    isbn: '9780134670549',
    title: 'Quantum Computing',
    author: 'John Preskill',
    category: 'Quantum Computing',
    shelf_location: 'QC-001',
    qty: 2,
    publisher: 'Cambridge University Press',
    year: 2021,
    description: 'Introduction to quantum computing and quantum algorithms.'
  }
];

function seedDemoData(database) {
  const now = new Date().toISOString();

  // Insert categories
  const categories = new Set(SAMPLE_BOOKS.map(b => b.category));
  const insertCategory = database.prepare(`
    INSERT OR IGNORE INTO book_categories (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  const getCategoryId = database.prepare('SELECT id FROM book_categories WHERE name = ?');

  database.transaction(() => {
    for (const cat of categories) {
      const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertCategory.run(id, cat, now, now);
    }
  })();

  // Insert books
  const insertBook = database.prepare(`
    INSERT INTO books (id, isbn, title, author, description, category_id, shelf_location, quantity_total, quantity_available, version, created_at, updated_at)
    SELECT ?, ?, ?, ?, ?, (SELECT id FROM book_categories WHERE name = ?), ?, ?, ?, 1, ?, ?
  `);

  let count = 0;
  database.transaction(() => {
    for (const book of SAMPLE_BOOKS) {
      const id = `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const desc = book.description || null;
      insertBook.run(
        id, book.isbn || null, book.title, book.author, desc,
        book.category, book.shelf_location, book.qty, book.qty, now, now
      );
      count++;
    }
  })();

  console.log(`  Seeded ${count} books across ${categories.size} categories`);

  // Seed discussion rooms
  const rooms = [
    { name: 'Silent Study Room A', capacity: 6 },
    { name: 'Group Study Room B', capacity: 12 },
    { name: 'Presentation Room C', capacity: 20 },
  ];
  const insertRoom = database.prepare(`
    INSERT OR IGNORE INTO discussion_rooms (id, name, capacity, is_active, version, created_at, updated_at)
    VALUES (?, ?, ?, 1, 1, ?, ?)
  `);
  database.transaction(() => {
    for (const room of rooms) {
      const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertRoom.run(id, room.name, room.capacity, now, now);
    }
  })();
  console.log(`  Seeded ${rooms.length} discussion rooms`);

  // Seed e-resource categories
  const erCategories = ['Academic Databases', 'Online Journals', 'Video Lectures'];
  const insertERCat = database.prepare(`
    INSERT OR IGNORE INTO e_resource_categories (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  database.transaction(() => {
    for (const cat of erCategories) {
      const id = `ercat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertERCat.run(id, cat, now, now);
    }
  })();

  // Seed e-resources
  const eResources = [
    { title: 'IEEE Xplore Digital Library', description: 'Full-text access to technical literature in engineering and technology.', url: 'https://ieeexplore.ieee.org', categoryId: erCategories[0], requires: 1 },
    { title: 'ACM Digital Library', description: 'Comprehensive computing literature database.', url: 'https://dl.acm.org', categoryId: erCategories[0], requires: 1 },
    { title: 'JSTOR', description: 'Digital library of academic journals and primary sources.', url: 'https://www.jstor.org', categoryId: erCategories[1], requires: 0 },
    { title: 'Coursera for University', description: 'Online courses from top universities.', url: 'https://www.coursera.org', categoryId: erCategories[2], requires: 0 },
    { title: 'Nature Journals', description: 'Scientific research articles across disciplines.', url: 'https://www.nature.com', categoryId: erCategories[1], requires: 1 },
  ];
  const insertER = database.prepare(`
    INSERT INTO e_resource_items (id, title, description, url, category_id, requires_campus_network, version, created_at, updated_at)
    SELECT ?, ?, ?, ?, (SELECT id FROM e_resource_categories WHERE name = ?), ?, 1, ?, ?
  `);
  database.transaction(() => {
    for (const er of eResources) {
      const id = `er_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertER.run(id, er.title, er.description, er.url, er.categoryId, er.requires, now, now);
    }
  })();
  console.log(`  Seeded ${eResources.length} e-resources`);

  // Seed holidays
  const holidays = [
    { date: '2025-01-26', name: 'Republic Day', isClosed: 1, notes: 'National holiday' },
    { date: '2025-08-15', name: 'Independence Day', isClosed: 1, notes: 'National holiday' },
    { date: '2025-12-25', name: 'Christmas Day', isClosed: 1, notes: 'National holiday' },
  ];
  const insertHoliday = database.prepare(`
    INSERT INTO holidays (id, date, name, is_closed, special_opening, special_closing, notes, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  database.transaction(() => {
    for (const h of holidays) {
      const id = `hol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertHoliday.run(id, h.date, h.name, h.isClosed, null, null, h.notes, now, now);
    }
  })();
  console.log(`  Seeded ${holidays.length} holidays`);

  // Seed announcements
  const announcements = [
    { title: 'Summer Workshop Series', body: 'Join our 3-day AI workshop from July 15-17. Registration opens July 1st.', isPublished: 1, startsAt: '2025-07-01T00:00:00Z', endsAt: '2025-07-15T00:00:00Z' },
    { title: 'New Books Added', body: '50 new titles added to the Computer Science and AI sections.', isPublished: 1, startsAt: '2025-06-01T00:00:00Z', endsAt: '2025-07-01T00:00:00Z' },
  ];
  const insertAnn = database.prepare(`
    INSERT INTO announcements (id, title, body, starts_at, ends_at, is_published, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  database.transaction(() => {
    for (const ann of announcements) {
      const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      insertAnn.run(id, ann.title, ann.body, ann.startsAt, ann.endsAt, ann.isPublished, now, now);
    }
  })();
  console.log(`  Seeded ${announcements.length} announcements`);

  // Seed general info
  const rulesMarkdown = `# Library Rules and Guidelines

## General Conduct
1. Silence mobile phones or set to vibrate mode
2. Food and beverages are not allowed inside the library
3. Maintain cleanliness and proper seating discipline

## Book Borrowing
1. Valid student/faculty ID card is required for borrowing
2. Maximum 3 books can be borrowed for 14 days
3. No renewal for reference books
4. Return books on or before the due date to avoid fines

## Study Areas
1. Silent zones designated for individual study
2. Group study rooms must be booked in advance
3. Discussion areas are designated on the ground floor

## Electronic Resources
1. Wi-Fi is available throughout the library
2. Power outlets are available at designated locations
3. Printing/copying services available at Rs. 5 per page

## Violation Policy
1. First violation: warning
2. Second violation: 2-week library access suspension
3. Third violation: 1-semester library access suspension`;

  const timings = [
    { weekday: 'Monday', opening: '08:00', closing: '22:00', notes: 'Reading hall open 24h via card access' },
    { weekday: 'Tuesday', opening: '08:00', closing: '22:00', notes: 'Reading hall open 24h via card access' },
    { weekday: 'Wednesday', opening: '08:00', closing: '22:00', notes: 'Reading hall open 24h via card access' },
    { weekday: 'Thursday', opening: '08:00', closing: '22:00', notes: 'Reading hall open 24h via card access' },
    { weekday: 'Friday', opening: '08:00', closing: '22:00', notes: 'Reading hall open 24h via card access' },
    { weekday: 'Saturday', opening: '09:00', closing: '18:00', notes: '' },
    { weekday: 'Sunday', opening: '10:00', closing: '17:00', notes: 'Limited services' }
  ];

  const timingsJson = JSON.stringify(timings);
  const contactJson = JSON.stringify({
    email: 'library@niituniversity.in',
    phone: '+91-1234-567890',
    address: 'NIIT University, Neemrana, Rajasthan'
  });

  const insertInfo = database.prepare(`
    INSERT INTO general_info (id, rules_markdown, timings_json, contact_info, version, updated_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  insertInfo.run('default', rulesMarkdown, timingsJson, contactJson, now);
  console.log('  Seeded general info (rules, timings, contact)');
  console.log('Demo data seed complete!');
}

const db = new Database(dbPath);

// First ensure migrations are applied
console.log('Applying migrations...');
execSync('node src/db/migrate.js', { stdio: 'inherit', cwd: resolve(__dirname, '..') });

// Seed roles and super admin
const superAdminLoginId = process.env.SUPER_ADMIN_LOGIN_ID || 'superadmin';
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123456';
seedDatabase(db, { loginId: superAdminLoginId, password: superAdminPassword, displayName: 'Super Administrator' });

// Then seed demo data
seedDemoData(db);

console.log('\nAll demo data seeded successfully!');
db.close();
