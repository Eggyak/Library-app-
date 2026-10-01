import {
  UserProfile,
  DiscussionRoomBooking,
  NewsClipping,
  IssuedBook,
  LibraryVisit,
  Book,
  LibraryTimingItem,
  BookRequisition
} from '../types';

export const initialStudentUser: UserProfile = {
  id: 'usr_student_01',
  name: 'Yash Kumar',
  email: 'Yash.Kumar24@st.niituniversity.in',
  role: 'student',
  enrollmentNo: 'BT24GCS007',
  mobile: '9311712038',
  dob: '2006-09-29',
  bloodGroup: 'B+',
  programCode: 'B.Tech./CSE/2024-2028/Jul/Reg/Deg',
  session: 'Semester I (Jul-Dec) 2026-2027',
  currentPattern: 'Semester V',
  fatherName: 'Vitenderkumar',
  fatherMobile: '9910071112',
  motherName: 'Deepshikha',
  motherMobile: '9910071112',
  rfidNumber: 'NU-8472-1936',
};

export const initialAdminUser: UserProfile = {
  id: 'usr_admin_01',
  name: 'Dr. Vinay Kumar Kainthola',
  email: 'Vinay.Kainthola@niituniversity.in',
  role: 'admin',
  enrollmentNo: 'LIRC-HEAD',
  mobile: '9829366828',
  dob: '1980-05-15',
  bloodGroup: 'O+',
  programCode: 'Staff / LIRC In-Charge',
  session: 'Academic Year 2026-2027',
  currentPattern: 'Library Administration',
  fatherName: '-',
  fatherMobile: '-',
  motherName: '-',
  motherMobile: '-',
};

export const initialBookings: DiscussionRoomBooking[] = [
  {
    id: 'bk_101',
    allotmentRef: 'NU-DR-2026-9081',
    studentName: 'Yash Kumar',
    enrollmentNo: 'BT24GCS007',
    studentEmail: 'Yash.Kumar24@st.niituniversity.in',
    bookingDate: '2026-09-20',
    timeSlot: '04:00 PM - 06:00 PM',
    groupSize: 5,
    reason: 'Capstone Project presentation rehearsal and model evaluation with project team',
    status: 'approved',
    submittedAt: '2026-09-18 14:30',
    adminRemarks: 'Approved. Allotted Discussion Room 2. Collect room key and remote from circulation desk.',
    allottedRoom: 'Discussion Room 2',
    roomName: 'Discussion Room 2'
  },
  {
    id: 'bk_102',
    allotmentRef: 'NU-DR-2026-9082',
    studentName: 'Yash Kumar',
    enrollmentNo: 'BT24GCS007',
    studentEmail: 'Yash.Kumar24@st.niituniversity.in',
    bookingDate: '2026-09-22',
    timeSlot: '11:00 AM - 01:00 PM',
    groupSize: 4,
    reason: 'Machine Learning Lab project preparation and model training benchmark discussion',
    status: 'pending',
    submittedAt: '2026-09-19 00:15'
  },
  {
    id: 'bk_103',
    allotmentRef: 'NU-DR-2026-9083',
    studentName: 'Aarav Sharma',
    enrollmentNo: 'BT24GCS042',
    studentEmail: 'aarav.sharma24@st.niituniversity.in',
    bookingDate: '2026-09-21',
    timeSlot: '02:00 PM - 04:00 PM',
    groupSize: 7,
    reason: 'NU Tech Fest Coding Committee organizing meeting',
    status: 'pending',
    submittedAt: '2026-09-18 19:40'
  },
  {
    id: 'bk_104',
    allotmentRef: 'NU-DR-2026-9084',
    studentName: 'Sneha Patel',
    enrollmentNo: 'BT23ECE019',
    studentEmail: 'sneha.patel23@st.niituniversity.in',
    bookingDate: '2026-09-19',
    timeSlot: '05:00 PM - 07:00 PM',
    groupSize: 10,
    reason: 'IEEE Student Chapter executive council meeting',
    status: 'approved',
    submittedAt: '2026-09-17 11:20',
    adminRemarks: 'Approved. Allotted Discussion Room 4 (Seminar Room).',
    allottedRoom: 'Discussion Room 4',
    roomName: 'Discussion Room 4'
  },
  {
    id: 'bk_105',
    allotmentRef: 'NU-DR-2026-9085',
    studentName: 'Yash Kumar',
    enrollmentNo: 'BT24GCS007',
    studentEmail: 'Yash.Kumar24@st.niituniversity.in',
    bookingDate: '2026-09-25',
    timeSlot: '02:00 PM - 04:00 PM',
    groupSize: 3,
    reason: 'Group study for Data Structures exam',
    status: 'approved',
    submittedAt: '2026-09-20 10:00',
    allottedRoom: 'Discussion Room 1',
    roomName: 'Discussion Room 1'
  },
  {
    id: 'bk_106',
    allotmentRef: 'NU-DR-2026-9086',
    studentName: 'Yash Kumar',
    enrollmentNo: 'BT24GCS007',
    studentEmail: 'Yash.Kumar24@st.niituniversity.in',
    bookingDate: '2026-09-23',
    timeSlot: '06:00 PM - 08:00 PM',
    groupSize: 6,
    reason: 'Project demo rehearsal for final year project',
    status: 'rejected',
    submittedAt: '2026-09-19 15:30',
    adminRemarks: 'Rejected. Time slot conflicts with library maintenance schedule. Please book alternative slot.',
    allottedRoom: 'Discussion Room 3',
    roomName: 'Discussion Room 3'
  }
];

export const initialNewsClippings: NewsClipping[] = [
  {
    id: 'news_01',
    title: 'NIIT University Ranks in Top Tier for Industry-Linked Higher Education',
    date: '18 Sep 2026',
    category: 'NU in News',
    summary: 'The Economic Times featured NIIT University for its pioneering seamless integration of industry internships, green campus sustainability initiatives, and cutting-edge AI and Data Science curricula.',
    keyPoints: [
      'Over 95% placement consistency with top multinational tech leaders.',
      'Recognition for 100-acre green geothermal cooling eco-campus.',
      'Expansion of industry-sponsored research labs at LIRC and CCC.'
    ],
    sourceName: 'The Economic Times (Education Bureau)',
    pdfFileName: 'ET_NU_Industry_Linked_Rankings_Sep2026.pdf',
    pdfSize: '1.4 MB',
    isFeatured: true
  },
  {
    id: 'news_02',
    title: 'National AI Mission Expands University Access to Supercomputing Clusters',
    date: '17 Sep 2026',
    category: 'Science & Tech',
    summary: 'Ministry of Electronics & IT announces subsidized access to national compute nodes for premier technical universities. NU research scholars and undergraduate project students can leverage GPU clusters for deep learning research.',
    keyPoints: [
      'Access grant open for accredited engineering universities.',
      'Integration directly through academic library digital repository gates.',
      'LIRC facilitates portal access credentials for registered students.'
    ],
    sourceName: 'Times of India - Tech Trends',
    pdfFileName: 'National_AI_Mission_Higher_Ed_Sep2026.pdf',
    pdfSize: '840 KB',
    isFeatured: false
  },
  {
    id: 'news_03',
    title: 'New National Education Framework Emphasizes Open Access Academic Publishing',
    date: '15 Sep 2026',
    category: 'Higher Education',
    summary: 'UGC mandates transition towards open access repositories and federated university library discovery. NIIT University LIRC joins national digital consortium DELNET and INFLIBNET upgraded nodes.',
    keyPoints: [
      'Free full-text download rights for enrolled undergraduate students across 5,000+ indexed journals.',
      'Inter-Library Loan (ILL) streamlined through digitised document delivery.'
    ],
    sourceName: 'The Hindu Education Plus',
    pdfFileName: 'UGC_Open_Access_LIRC_Brief_2026.pdf',
    pdfSize: '1.1 MB',
    isFeatured: false
  },
  {
    id: 'news_04',
    title: 'Geothermal Cooling Architecture at NU Featured in Global Green Architecture Digest',
    date: '12 Sep 2026',
    category: 'NU in News',
    summary: 'Architectural Digest explores how NIIT University Neemrana maintains year-round comfortable indoor temperatures across academic blocks and the central library through underground Earth Air Tunnel (EAT) technology.',
    keyPoints: [
      'Reduces carbon footprint and electrical HVAC energy usage by up to 60%.',
      'Quiet air flow design tailored specifically for library reading halls and study zones.'
    ],
    sourceName: 'Architectural Review & Green Campus Forum',
    pdfFileName: 'NU_Green_EAT_Campus_Digest_2026.pdf',
    pdfSize: '2.3 MB',
    isFeatured: false
  }
];

export const initialIssuedBooks: IssuedBook[] = [
  {
    id: 'iss_01',
    bookId: 'cat_02',
    title: 'Artificial Intelligence: A Modern Approach (4th Edition)',
    author: 'Stuart Russell & Peter Norvig',
    isbn: '978-0134610993',
    issueDate: '08 Sep 2026',
    dueDate: '23 Sep 2026',
    status: 'active',
    renewalCount: 1,
    fineAmount: 0
  },
  {
    id: 'iss_02',
    bookId: 'cat_03',
    title: 'Computer Networking: A Top-Down Approach (8th Edition)',
    author: 'James F. Kurose & Keith W. Ross',
    isbn: '978-0136681557',
    issueDate: '12 Sep 2026',
    dueDate: '27 Sep 2026',
    status: 'active',
    renewalCount: 0,
    fineAmount: 0
  },
  {
    id: 'iss_03',
    bookId: 'cat_05',
    title: 'Database System Concepts (7th Edition)',
    author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
    isbn: '978-0078022159',
    issueDate: '15 Jul 2026',
    dueDate: '30 Jul 2026',
    returnDate: '29 Jul 2026',
    status: 'returned',
    renewalCount: 0
  },
  {
    id: 'iss_04',
    bookId: 'cat_06',
    title: 'Introduction to Algorithms (CLRS 3rd Edition)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest',
    isbn: '978-0262033848',
    issueDate: '20 Apr 2026',
    dueDate: '05 May 2026',
    returnDate: '04 May 2026',
    status: 'returned',
    renewalCount: 1
  },
  {
    id: 'iss_05',
    bookId: 'bk_code_01',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    issueDate: '02 Mar 2026',
    dueDate: '17 Mar 2026',
    returnDate: '16 Mar 2026',
    status: 'returned',
    renewalCount: 0
  }
];

export const initialVisits: LibraryVisit[] = [
  { id: 'v_01', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '18 Sep 2026', entryTime: '16:15', exitTime: '18:45', durationMinutes: 150, purpose: 'Study and Reference Reading' },
  { id: 'v_02', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '16 Sep 2026', entryTime: '14:00', exitTime: '17:10', durationMinutes: 190, purpose: 'Reference Reading and ML Assignment' },
  { id: 'v_03', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '14 Sep 2026', entryTime: '19:30', exitTime: '21:45', durationMinutes: 135, purpose: 'Exam Preparation' },
  { id: 'v_04', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '12 Sep 2026', entryTime: '10:10', exitTime: '12:00', durationMinutes: 110, purpose: 'Book Borrowing and Reading' },
  { id: 'v_05', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '09 Sep 2026', entryTime: '15:20', exitTime: '18:30', durationMinutes: 190, purpose: 'Capstone Project Research' },
  { id: 'v_06', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '07 Sep 2026', entryTime: '18:00', exitTime: '20:15', durationMinutes: 135, purpose: 'Quiet Reading Zone' },
  { id: 'v_07', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '04 Sep 2026', entryTime: '11:00', exitTime: '13:30', durationMinutes: 150, purpose: 'Group Study' },
  { id: 'v_08', studentId: 'usr_student_01', studentName: 'Yash Kumar', date: '01 Sep 2026', entryTime: '17:00', exitTime: '19:00', durationMinutes: 120, purpose: 'Journal Browsing' }
];

export const libraryTimings: LibraryTimingItem[] = [
  {
    dayRange: 'Monday - Friday (Working Days)',
    openingHours: '08:00 AM - 11:00 PM',
    circulationHours: '09:00 AM - 08:00 PM',
    notes: 'Reference stacks, computer nodes, and discussion rooms open.'
  },
  {
    dayRange: 'Saturdays & Sundays (Weekends)',
    openingHours: '09:00 AM - 09:00 PM',
    circulationHours: '10:00 AM - 05:00 PM',
    notes: 'Self-study and book circulation available.'
  },
  {
    dayRange: 'Examination Period',
    openingHours: '08:00 AM - 01:00 AM (Midnight)',
    circulationHours: '09:00 AM - 09:00 PM',
    notes: 'Night reading extended hours for mid-sem and end-sem exams.'
  },
  {
    dayRange: 'University Gazetted Holidays',
    openingHours: '10:00 AM - 05:00 PM',
    circulationHours: 'Closed',
    notes: 'Self-study reading halls remain accessible.'
  }
];

export const initialCatalog: Book[] = [
  {
    id: 'cat_01',
    biblionumber: '21178',
    title: 'Programming in Python 3: A Complete Introduction to the Python Language',
    author: 'Mark Summerfield',
    isbn: '9789352869176',
    publisher: 'Pearson Education',
    year: '2022',
    callNumber: '005.133 SUM',
    stackLocation: 'Stack 04 - Shelf B',
    copiesAvailable: 4,
    totalCopies: 6,
    category: 'Computer Science',
    description: 'Comprehensive guide covering Python 3 foundations, OOP, concurrent programming, and standard library modules.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9789352869176-M.jpg',
    topics: ['python', 'python 3', 'programming', 'object oriented programming', 'oop', 'classes', 'inheritance', 'polymorphism', 'data structures', 'lists', 'dictionaries', 'sets', 'tuples', 'generators', 'iterators', 'decorators', 'file handling', 'exception handling', 'concurrency', 'multithreading', 'regular expressions', 'functional programming'],
    keyConcepts: ['List & Dict Comprehensions', 'Generators & `yield` Keyword', 'Decorators & Function Closures', 'OOP Inheritance & Magic Methods', 'Context Managers (`with` blocks)', 'Multithreading & GIL Constraints'],
    strugglingWith: ['how Python decorators work', 'difference between iterators and generators', 'object oriented programming classes and inheritance in Python', 'concurrency and multithreading in Python', 'file handling and context managers'],
    recommendedChapters: [
      { chapter: 'Chapter 3', title: 'Collection Data Types', topics: ['Lists', 'Dictionaries', 'Tuples', 'Sets'] },
      { chapter: 'Chapter 6', title: 'Object-Oriented Programming', topics: ['Classes', 'Inheritance', 'Polymorphism'] },
      { chapter: 'Chapter 8', title: 'Advanced Programming Techniques', topics: ['Decorators', 'Generators', 'Context Managers'] }
    ],
    difficulty: 'Beginner'
  },
  {
    id: 'cat_02',
    biblionumber: '19402',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell and Peter Norvig',
    isbn: '9780134610993',
    publisher: 'Pearson',
    year: '2021',
    callNumber: '006.3 RUS',
    stackLocation: 'Stack 04 - Shelf C',
    copiesAvailable: 2,
    totalCopies: 5,
    category: 'Computer Science',
    description: 'The definitive textbook for AI courses covering informed search, game theory, logic, probabilistic models, and machine learning.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780134610993-M.jpg',
    topics: ['artificial intelligence', 'ai', 'search algorithms', 'a* search', 'heuristic search', 'minimax algorithm', 'alpha beta pruning', 'logic', 'propositional logic', 'first order logic', 'knowledge representation', 'planning', 'markov decision processes', 'mdp', 'reinforcement learning', 'q learning', 'natural language processing', 'nlp', 'machine learning', 'bayesian networks', 'probabilistic reasoning', 'game theory'],
    keyConcepts: ['A* Search with Admissible Heuristics', 'Minimax & Alpha-Beta Pruning in Game Trees', 'First-Order Logic Resolution & Unification', 'Markov Decision Processes (MDP) & Bellman Equation', 'Q-Learning in Reinforcement Learning', 'Bayesian Belief Networks Inference'],
    strugglingWith: ['I don\'t understand A* heuristic search and admissible heuristics', 'alpha-beta pruning minimax game trees', 'Markov decision process MDP value iteration', 'how Bayesian networks calculate conditional probabilities', 'first order logic resolution proofs'],
    recommendedChapters: [
      { chapter: 'Chapter 3 & 4', title: 'Informed Search & Heuristic Methods', topics: ['A* Search', 'Heuristics', 'Local Search'] },
      { chapter: 'Chapter 5', title: 'Adversarial Search & Games', topics: ['Minimax', 'Alpha-Beta Pruning'] },
      { chapter: 'Chapter 13 & 14', title: 'Probabilistic Reasoning', topics: ['Bayesian Networks', 'Inference'] },
      { chapter: 'Chapter 21', title: 'Reinforcement Learning', topics: ['Q-Learning', 'Policy Iteration', 'Bellman Equation'] }
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'cat_03',
    biblionumber: '18055',
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James F. Kurose, Keith W. Ross',
    isbn: '9780136681557',
    publisher: 'Pearson',
    year: '2021',
    callNumber: '004.6 KUR',
    stackLocation: 'Stack 05 - Shelf A',
    copiesAvailable: 3,
    totalCopies: 5,
    category: 'Computer Science',
    description: 'Focuses on application-layer paradigms down through transport, network, and physical data communications with hands-on labs.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780136681557-M.jpg',
    topics: ['computer networks', 'networking', 'tcp/ip', 'osi model', 'application layer', 'http', 'https', 'dns', 'transport layer', 'tcp', 'udp', 'three-way handshake', 'tcp handshake', 'congestion control', 'flow control', 'sliding window', 'network layer', 'ip addressing', 'subnetting', 'routing algorithms', 'link state', 'distance vector', 'bgp', 'ospf', 'data link layer', 'ethernet', 'arp', 'mac address', 'sockets'],
    keyConcepts: ['TCP 3-Way Handshake (SYN, SYN-ACK, ACK)', 'TCP Congestion Control (Slow Start, AIMD)', 'IP Subnetting & CIDR Calculation', 'Dijkstra Link-State vs Bellman-Ford Distance Vector', 'DNS Hierarchical Resolution', 'ARP Protocol Mapping IP to MAC'],
    strugglingWith: ['I don\'t understand TCP 3-way handshake and connection teardown', 'how subnetting and CIDR prefix works', 'difference between TCP flow control and congestion control', 'distance vector vs link state routing algorithms', 'DNS recursive vs iterative queries'],
    recommendedChapters: [
      { chapter: 'Chapter 2', title: 'Application Layer', topics: ['HTTP Protocol', 'DNS Hierarchy', 'Socket Programming'] },
      { chapter: 'Chapter 3', title: 'Transport Layer', topics: ['TCP 3-Way Handshake', 'Flow Control', 'Congestion Control (AIMD)'] },
      { chapter: 'Chapter 4 & 5', title: 'Network Layer: Data & Control Plane', topics: ['IP Addressing & Subnetting', 'Routing Algorithms (OSPF, BGP)'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_04',
    biblionumber: '15234',
    title: 'Operating System Concepts (Silberschatz)',
    author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
    isbn: '9781119800361',
    publisher: 'Wiley',
    year: '2020',
    callNumber: '005.43 SIL',
    stackLocation: 'Stack 05 - Shelf B',
    copiesAvailable: 5,
    totalCopies: 8,
    category: 'Computer Science',
    description: 'The classic book covering processes, threads, CPU scheduling, synchronization, deadlocks, and virtual memory management.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9781119800361-M.jpg',
    topics: ['operating systems', 'os', 'deadlocks', 'deadlock prevention', 'deadlock avoidance', 'deadlock detection', 'banker\'s algorithm', 'processes', 'process management', 'threads', 'multithreading', 'cpu scheduling', 'first come first serve', 'round robin', 'shortest job first', 'process synchronization', 'semaphores', 'mutex', 'critical section', 'race conditions', 'virtual memory', 'paging', 'page replacement', 'fifo', 'lru', 'thrashing', 'file systems', 'inter-process communication', 'ipc'],
    keyConcepts: ['Coffman 4 Conditions for Deadlock', 'Banker\'s Algorithm for Deadlock Avoidance', 'Mutex Locks & Counting Semaphores', 'Peterson\'s Solution for Critical Section', 'Demand Paging & Page Fault Handling', 'LRU, FIFO & Optimal Page Replacement', 'CPU Scheduling: Round Robin & Multi-Level Queue'],
    strugglingWith: ['I don\'t understand deadlocks and banker\'s algorithm', 'process synchronization semaphores and mutex locks', 'how does virtual memory paging and page replacement work', 'CPU scheduling algorithms Round Robin and SJF', 'race conditions and the critical section problem'],
    recommendedChapters: [
      { chapter: 'Chapter 5', title: 'CPU Scheduling', topics: ['Round Robin', 'SJF', 'Multi-Level Feedback Queues'] },
      { chapter: 'Chapter 6 & 7', title: 'Synchronization Tools & Examples', topics: ['Critical Section', 'Mutex', 'Semaphores', 'Dining Philosophers'] },
      { chapter: 'Chapter 8', title: 'Deadlocks', topics: ['Coffman Conditions', 'Banker\'s Algorithm', 'Deadlock Recovery'] },
      { chapter: 'Chapter 9 & 10', title: 'Main Memory & Virtual Memory', topics: ['Paging', 'TLB', 'Page Replacement (LRU/FIFO)', 'Thrashing'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_05',
    biblionumber: '16890',
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
    isbn: '9780078022159',
    publisher: 'McGraw-Hill',
    year: '2020',
    callNumber: '005.74 SIL',
    stackLocation: 'Stack 05 - Shelf C',
    copiesAvailable: 4,
    totalCopies: 7,
    category: 'Computer Science',
    description: 'Relational data model, SQL, normalization, transactions, concurrency control, distributed databases, and indexing algorithms.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780078022159-M.jpg',
    topics: ['database', 'dbms', 'sql', 'relational model', 'relational algebra', 'normalization', 'functional dependency', '1nf', '2nf', '3nf', 'bcnf', 'transactions', 'acid properties', 'concurrency control', 'two phase locking', '2pl', 'deadlock in dbms', 'indexing', 'b+ tree', 'b tree', 'hashing', 'query optimization', 'nosql', 'entity relationship', 'er diagram'],
    keyConcepts: ['Relational Algebra Selection, Projection & Joins', 'Functional Dependencies & Candidate Keys', '3NF & BCNF Lossless Decomposition', 'ACID Properties (Atomicity, Consistency, Isolation, Durability)', 'Two-Phase Locking (2PL) Concurrency Protocol', 'B+ Tree Balanced Search Indexing'],
    strugglingWith: ['how to normalize a database table to 3NF and BCNF', 'functional dependencies and candidate key derivation', 'ACID transactions and concurrency anomalies dirty read lost update', 'how B+ trees work in indexing', 'relational algebra query formulation'],
    recommendedChapters: [
      { chapter: 'Chapter 6', title: 'Database Design & Normalization', topics: ['Functional Dependencies', '3NF', 'BCNF'] },
      { chapter: 'Chapter 11', title: 'Indexing and Hashing', topics: ['B+ Trees', 'Hashing Index Structures'] },
      { chapter: 'Chapter 14 & 15', title: 'Transactions & Concurrency Control', topics: ['ACID', 'Serializability', 'Two-Phase Locking (2PL)'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_06',
    biblionumber: '14101',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '9780262033848',
    publisher: 'MIT Press',
    year: '2022',
    callNumber: '005.1 COR',
    stackLocation: 'Stack 06 - Shelf A',
    copiesAvailable: 1,
    totalCopies: 6,
    category: 'Computer Science',
    description: 'Essential reference for asymptotic analysis, divide and conquer, dynamic programming, greedy algorithms, and graph theory.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg',
    topics: ['algorithms', 'data structures', 'dynamic programming', 'greedy algorithms', 'divide and conquer', 'graph theory', 'shortest path', 'dijkstra\'s algorithm', 'bellman ford', 'breadth first search', 'depth first search', 'bfs', 'dfs', 'minimum spanning tree', 'kruskal', 'prim', 'asymptotic notation', 'big o', 'recurrence relations', 'master theorem', 'sorting algorithms', 'quicksort', 'mergesort', 'binary search trees', 'red black trees', 'np completeness'],
    keyConcepts: ['Asymptotic Analysis & Big-O Notation', 'Master Theorem for Divide-and-Conquer Recurrences', 'Dynamic Programming Subproblem Overlap & Optimal Substructure', 'Dijkstra Single-Source Shortest Path', 'Bellman-Ford Algorithm with Negative Weight Cycles', 'Prim and Kruskal Minimum Spanning Trees', 'Red-Black Tree Balancing & Rotations'],
    strugglingWith: ['how does dynamic programming work and identifying subproblems', 'I don\'t understand recurrence relations and master theorem', 'dijkstra vs bellman ford shortest path algorithms', 'red-black tree balancing rotations', 'graph traversal BFS and DFS algorithms'],
    recommendedChapters: [
      { chapter: 'Chapter 4', title: 'Divide-and-Conquer', topics: ['Master Theorem', 'Recurrence Trees'] },
      { chapter: 'Chapter 15', title: 'Dynamic Programming', topics: ['Rod Cutting', 'Matrix-Chain Multiplication', 'Longest Common Subsequence'] },
      { chapter: 'Chapter 16', title: 'Greedy Algorithms', topics: ['Activity Selection', 'Huffman Codes'] },
      { chapter: 'Chapter 22-24', title: 'Graph Algorithms', topics: ['BFS/DFS', 'Dijkstra', 'Bellman-Ford', 'Floyd-Warshall'] }
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'cat_07',
    biblionumber: '22104',
    title: 'Indian Knowledge Systems: Concepts and Applications',
    author: 'Kapil Kapoor & A.K. Singh',
    isbn: '9788124603369',
    publisher: 'D.K. Printworld',
    year: '2021',
    callNumber: '954 KAP',
    stackLocation: 'Stack 01 - Shelf A (IKS Section)',
    copiesAvailable: 6,
    totalCopies: 6,
    category: 'Indian Knowledge System',
    description: 'Introduces ancient Indian traditions of astronomy, linguistics, mathematics, logic, metallurgy, and architecture.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9788124603369-M.jpg',
    topics: ['indian knowledge system', 'iks', 'vedic science', 'ancient indian mathematics', 'sulba sutras', 'aryabhata', 'astronomy', 'panini grammar', 'sanskrit linguistics', 'metallurgy', 'ayurveda', 'traditional architecture', 'vastu', 'nyaya logic', 'indian philosophy', 'epistemology', 'pramana'],
    keyConcepts: ['Sulba Sutras Geometry & Geometric Algebra', 'Aryabhata Sine Tables & Planetary Model', 'Panini Ashtadhyayi Generative Grammatical Rules', 'Nyaya Epistemology: Pratyaksha, Anumana, Upamana, Shabda', 'Wootz Steel & Ancient Indian Metallurgy'],
    strugglingWith: ['ancient Indian mathematical contributions Aryabhata and Sulba Sutras', 'Panini linguistic generative system and formal grammars', 'Nyaya logic epistemology Pramana theory of valid knowledge'],
    recommendedChapters: [
      { chapter: 'Section 2', title: 'Mathematics and Astronomy in India', topics: ['Sulba Sutras', 'Aryabhata', 'Pancasiddhantika'] },
      { chapter: 'Section 3', title: 'Linguistics & Philosophy of Language', topics: ['Panini Ashtadhyayi', 'Vakyapadiya'] },
      { chapter: 'Section 4', title: 'Epistemology & Logic', topics: ['Nyaya Philosophy', 'Pramanas'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_08',
    biblionumber: '20512',
    title: 'The Lean Startup: How Constant Innovation Creates Radically Successful Businesses',
    author: 'Eric Ries',
    isbn: '9780307887894',
    publisher: 'Crown Business',
    year: '2019',
    callNumber: '658.11 RIE',
    stackLocation: 'Stack 08 - Shelf C (Entrepreneurship)',
    copiesAvailable: 3,
    totalCopies: 4,
    category: 'Entrepreneurship',
    description: 'Build-Measure-Learn feedback loop, minimum viable products (MVP), and agile startup methodology.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780307887894-M.jpg',
    topics: ['entrepreneurship', 'startup', 'lean startup', 'minimum viable product', 'mvp', 'build measure learn', 'validated learning', 'pivot', 'product market fit', 'agile business', 'innovation accounting', 'continuous deployment', 'customer development', 'value hypothesis', 'growth hypothesis', 'business model canvas'],
    keyConcepts: ['Build-Measure-Learn Feedback Loop', 'Minimum Viable Product (MVP) Prototyping', 'Pivot or Persevere Decision Criteria', 'Actionable Metrics vs Vanity Metrics', 'Validated Learning Cycles'],
    strugglingWith: ['how to design a minimum viable product MVP', 'how to validate product market fit with metrics', 'when and how to execute a startup pivot', 'Build-Measure-Learn feedback cycle in startups'],
    recommendedChapters: [
      { chapter: 'Chapter 5', title: 'Define & Experiment', topics: ['Hypothesis Testing', 'Validation'] },
      { chapter: 'Chapter 6', title: 'Minimum Viable Product', topics: ['MVP Creation', 'Customer Feedback'] },
      { chapter: 'Chapter 8', title: 'Pivot (or Persevere)', topics: ['Types of Pivots', 'Runway Strategy'] }
    ],
    difficulty: 'Beginner'
  },
  {
    id: 'cat_09',
    biblionumber: '19844',
    title: 'Signals and Systems (2nd Edition)',
    author: 'Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab',
    isbn: '9780138147570',
    publisher: 'Prentice Hall',
    year: '2018',
    callNumber: '621.382 OPP',
    stackLocation: 'Stack 07 - Shelf B',
    copiesAvailable: 5,
    totalCopies: 6,
    category: 'Electronics',
    description: 'Continuous-time and discrete-time signals, Fourier analysis, Laplace transform, and z-transform theory.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780138147570-M.jpg',
    topics: ['signals and systems', 'signals', 'fourier transform', 'continuous time fourier transform', 'discrete time fourier transform', 'dtft', 'fft', 'laplace transform', 'z transform', 'linear time invariant', 'lti systems', 'convolution', 'impulse response', 'frequency response', 'sampling theorem', 'nyquist rate', 'filters', 'bode plot', 'transfer function'],
    keyConcepts: ['LTI Systems & Convolution Integral/Sum', 'Fourier Series & Fourier Transform Duality', 'Laplace Transform Region of Convergence (ROC)', 'Z-Transform Inverse & Pole-Zero Stability', 'Nyquist-Shannon Sampling Frequency & Aliasing'],
    strugglingWith: ['I don\'t understand Fourier transform and frequency response', 'how convolution integral works in LTI systems', 'Laplace transform region of convergence ROC', 'Z-transform poles and zeroes stability', 'Nyquist rate and signal sampling'],
    recommendedChapters: [
      { chapter: 'Chapter 2', title: 'Linear Time-Invariant Systems', topics: ['Convolution', 'Impulse Response'] },
      { chapter: 'Chapter 4 & 5', title: 'Fourier Transform (Continuous & Discrete)', topics: ['Frequency Response', 'Filtering'] },
      { chapter: 'Chapter 9 & 10', title: 'The Laplace & Z-Transforms', topics: ['Region of Convergence (ROC)', 'System Stability'] }
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'cat_10',
    biblionumber: '23015',
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    isbn: '9780262035613',
    publisher: 'MIT Press',
    year: '2023',
    callNumber: '006.3 GOO',
    stackLocation: 'Stack 04 - Shelf D',
    copiesAvailable: 2,
    totalCopies: 4,
    category: 'Computer Science',
    description: 'Mathematics of deep networks, CNNs, RNNs, autoencoders, generative models, and optimization algorithms.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9780262035613-M.jpg',
    topics: ['deep learning', 'neural networks', 'backpropagation', 'gradient descent', 'stochastic gradient descent', 'sgd', 'convolutional neural networks', 'cnn', 'recurrent neural networks', 'rnn', 'lstm', 'autoencoders', 'generative adversarial networks', 'gans', 'loss functions', 'cross entropy', 'activation functions', 'relu', 'sigmoid', 'softmax', 'vanishing gradient', 'regularization', 'dropout', 'optimization', 'adam optimizer'],
    keyConcepts: ['Backpropagation Algorithm & Computational Graph Chain Rule', 'Stochastic Gradient Descent & Adaptive Learning Rates (Adam)', 'Convolution & Pooling in Feature Maps', 'Vanishing & Exploding Gradient Mitigations', 'LSTM Memory Cell & Forget Gate', 'Generative Adversarial Networks Minimax Objective'],
    strugglingWith: ['I am unable to understand backpropagation mathematics', 'how gradient descent updates weights with chain rule', 'vanishing gradient problem and how ReLU solves it', 'convolutional neural network filter operations', 'difference between RNN and LSTM cells'],
    recommendedChapters: [
      { chapter: 'Chapter 6', title: 'Deep Feedforward Networks', topics: ['Backpropagation', 'Gradient-Based Learning', 'Activation Functions'] },
      { chapter: 'Chapter 9', title: 'Convolutional Networks', topics: ['Convolution Operation', 'Pooling', 'Receptive Fields'] },
      { chapter: 'Chapter 10', title: 'Sequence Modeling: Recurrent and Recursive Nets', topics: ['RNN', 'LSTM', 'Gated Recurrent Units'] },
      { chapter: 'Chapter 20', title: 'Deep Generative Models', topics: ['Autoencoders', 'Generative Adversarial Networks (GANs)'] }
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'cat_11',
    biblionumber: '33609',
    title: 'Introduction to Large Language Models: Generative AI for Text',
    author: 'Shashank Mohan & Team',
    isbn: '9789354247891',
    publisher: 'BPB Publications',
    year: '2024',
    callNumber: '006.35 MOH',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 3,
    totalCopies: 5,
    category: 'Computer Science',
    description: 'Foundational concepts behind generative pre-trained transformers, attention mechanisms, fine-tuning, and enterprise LLM deployment.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9789354247891-M.jpg',
    topics: ['large language models', 'llm', 'generative ai', 'transformers', 'attention mechanism', 'self attention', 'multi-head attention', 'bert', 'gpt', 'prompt engineering', 'fine tuning', 'rag', 'retrieval augmented generation', 'vector embeddings', 'hallucination', 'rlhf', 'langchain', 'lora', 'peft'],
    keyConcepts: ['Self-Attention & Multi-Head Attention Mechanisms', 'Transformer Encoder-Decoder Architectures', 'Prompt Engineering (Few-Shot, Chain-of-Thought)', 'Retrieval-Augmented Generation (RAG) Architecture', 'LoRA & Parameter-Efficient Fine-Tuning (PEFT)'],
    strugglingWith: ['how attention mechanism and self-attention calculate weights', 'how to implement RAG retrieval augmented generation', 'fine-tuning LLMs vs prompt engineering', 'vector databases and semantic embeddings for LLMs'],
    recommendedChapters: [
      { chapter: 'Chapter 2', title: 'The Transformer Revolution', topics: ['Self-Attention', 'Positional Encoding'] },
      { chapter: 'Chapter 5', title: 'Retrieval-Augmented Generation (RAG)', topics: ['Vector Embeddings', 'Context Injection'] },
      { chapter: 'Chapter 7', title: 'Fine-Tuning & Alignment', topics: ['LoRA', 'RLHF', 'Guardrails'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_12',
    biblionumber: '33614',
    title: 'Pro MERN Stack: Full Stack Web App Development with Mongo, Express, React, and Node',
    author: 'Vasan Subramanian',
    isbn: '9781484243909',
    publisher: 'Apress',
    year: '2023',
    callNumber: '005.276 SUB',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 4,
    totalCopies: 6,
    category: 'Computer Science',
    description: 'End-to-end modern JavaScript engineering, single page architectures, REST & GraphQL APIs, and scalable cloud deployments.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9781484243909-M.jpg',
    topics: ['mern stack', 'react', 'react hooks', 'state management', 'nodejs', 'node', 'express', 'expressjs', 'mongodb', 'rest api', 'graphql', 'crud operations', 'javascript', 'typescript', 'authentication', 'jwt', 'full stack', 'web development'],
    keyConcepts: ['React State, Props & Lifecycle Hooks (`useEffect`, `useState`)', 'Express Routing & Custom Middleware Architecture', 'MongoDB Collections, Schemas & Mongoose Queries', 'JWT-Based User Authentication & Session Security', 'Single Page Application Client-Side Routing'],
    strugglingWith: ['I want to learn react and node js', 'how React useEffect and useState hooks work', 'connecting Express backend to MongoDB database', 'JWT token authentication in MERN stack', 'state management in React apps'],
    recommendedChapters: [
      { chapter: 'Chapter 4', title: 'React State & Lifecycle', topics: ['Hooks', 'Component Communication'] },
      { chapter: 'Chapter 7', title: 'Server-Side with Express', topics: ['Middleware', 'REST Endpoints'] },
      { chapter: 'Chapter 8', title: 'Database Integration with MongoDB', topics: ['Mongoose Models', 'CRUD'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_13',
    biblionumber: '33619',
    title: 'Ultimate Docker Container Book: Build, Test, Ship, and Run Containers with Docker and Kubernetes',
    author: 'Gabriel N. Schenker',
    isbn: '9781839218804',
    publisher: 'Packt Publishing',
    year: '2023',
    callNumber: '005.43 SCH',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 3,
    totalCopies: 4,
    category: 'Computer Science',
    description: 'Comprehensive guide to microservices orchestration, container security, Docker Compose, and Kubernetes cluster management.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9781839218804-M.jpg',
    topics: ['docker', 'containers', 'kubernetes', 'k8s', 'devops', 'microservices', 'docker compose', 'dockerfile', 'containerization', 'ci/cd', 'cluster management', 'pod', 'deployment', 'service mesh', 'cloud native', 'linux namespaces', 'cgroups'],
    keyConcepts: ['Container Virtualization vs Hypervisor Virtual Machines', 'Multi-Stage Dockerfile Optimization', 'Service Orchestration with Docker Compose', 'Kubernetes Pods, ReplicaSets & Cluster Architecture', 'Kubernetes Cluster Networking & Ingress Controllers'],
    strugglingWith: ['how Docker containers differ from virtual machines', 'writing multi-stage Dockerfiles', 'Docker Compose for multi-container apps', 'understanding Kubernetes Pods, Services, and Deployments', 'container orchestration and microservices'],
    recommendedChapters: [
      { chapter: 'Chapter 3', title: 'Building Docker Images', topics: ['Dockerfile Directives', 'Layer Caching'] },
      { chapter: 'Chapter 6', title: 'Docker Compose', topics: ['Multi-Service Stacks', 'Networking'] },
      { chapter: 'Chapter 10 & 11', title: 'Kubernetes in Practice', topics: ['Pods', 'ReplicaSets', 'Services'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_14',
    biblionumber: '33613',
    title: 'Practical Cyber Forensics: An Incident-Based Approach to Forensic Investigations',
    author: 'Niranjan Reddy',
    isbn: '9781484244593',
    publisher: 'Apress',
    year: '2023',
    callNumber: '005.8 RED',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 2,
    totalCopies: 4,
    category: 'Computer Science',
    description: 'Investigative workflows for network packet analysis, memory dump forensics, file carving, and digital chain of custody.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9781484244593-M.jpg',
    topics: ['cyber forensics', 'digital forensics', 'cybersecurity', 'incident response', 'network forensics', 'packet analysis', 'wireshark', 'memory analysis', 'volatility', 'file carving', 'chain of custody', 'evidence acquisition', 'malware analysis', 'cryptography'],
    keyConcepts: ['Digital Chain of Custody & Evidence Integrity', 'Live Memory (RAM) Acquisition & Volatility Analysis', 'Network Packet Analysis & TCP Stream Inspection', 'File Carving and Metadata Forensics (MFT/EXT4)', 'Anti-Forensics Identification Techniques'],
    strugglingWith: ['how to analyze memory dumps with Volatility', 'network packet inspection using Wireshark', 'digital forensic chain of custody rules', 'file carving and recovering deleted evidence'],
    recommendedChapters: [
      { chapter: 'Chapter 3', title: 'Evidence Acquisition & Preservation', topics: ['Forensic Imaging', 'Hashing'] },
      { chapter: 'Chapter 6', title: 'Memory Forensics', topics: ['RAM Dumps', 'Volatility Framework'] },
      { chapter: 'Chapter 8', title: 'Network & Packet Analysis', topics: ['Wireshark', 'PCAP Forensics'] }
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'cat_15',
    biblionumber: '33601',
    title: 'Principles of Distributed Database Systems',
    author: 'M. Tamer Ozsu, Patrick Valduriez',
    isbn: '9783030262525',
    publisher: 'Springer',
    year: '2022',
    callNumber: '005.74 OZS',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 2,
    totalCopies: 3,
    category: 'Computer Science',
    description: 'Distributed query processing, transactions, 2PC/3PC consensus, replication algorithms, and modern NoSQL architectures.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9783030262525-M.jpg',
    topics: ['distributed databases', 'distributed systems', 'consensus algorithms', 'two phase commit', '2pc', 'three phase commit', '3pc', 'paxos', 'raft', 'replication', 'partitioning', 'sharding', 'cap theorem', 'acid vs base', 'nosql', 'distributed query processing'],
    keyConcepts: ['Two-Phase Commit (2PC) Consensus Protocol', 'CAP Theorem (Consistency, Availability, Partition Tolerance)', 'Data Sharding & Consistent Hashing Rings', 'Quorum Replication & Vector Clocks', 'Distributed Deadlock Detection & Prevention'],
    strugglingWith: ['how Two-Phase Commit 2PC consensus works', 'understanding the CAP theorem trade-offs', 'consistent hashing for database sharding', 'data replication strategies and quorum consensus'],
    recommendedChapters: [
      { chapter: 'Chapter 11', title: 'Distributed Transaction Management', topics: ['2PC', '3PC', 'Serializability'] },
      { chapter: 'Chapter 13', title: 'Data Replication & Consistency', topics: ['CAP Theorem', 'Quorums'] }
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'cat_16',
    biblionumber: '33615',
    title: 'Computer Vision: Algorithms and Applications',
    author: 'Richard Szeliski',
    isbn: '9783030349431',
    publisher: 'Springer',
    year: '2022',
    callNumber: '006.37 SZE',
    stackLocation: 'New Arrivals Display - Shelf 48',
    copiesAvailable: 2,
    totalCopies: 4,
    category: 'Computer Science',
    description: '3D reconstruction, feature detection, object recognition, visual SLAM, and generative diffusion rendering.',
    coverImage: 'https://covers.openlibrary.org/b/isbn/9783030349431-M.jpg',
    topics: ['computer vision', 'image processing', 'edge detection', 'sobel filter', 'canny edge detector', 'feature extraction', 'sift', 'orb', 'image segmentation', 'object detection', 'yolo', '3d reconstruction', 'stereo vision', 'optical flow', 'visual slam', 'convolution'],
    keyConcepts: ['Canny Edge Detection Multi-Stage Pipeline', 'Scale-Invariant Feature Transform (SIFT)', 'Epipolar Geometry & Stereo Disparity Maps', 'Lucas-Kanade Optical Flow Formulation', 'Deep Convolutional Object Detection (YOLO)'],
    strugglingWith: ['how Canny edge detector works step-by-step', 'SIFT scale invariant feature matching', 'epipolar geometry and stereo depth estimation', 'image convolutions and filter kernels'],
    recommendedChapters: [
      { chapter: 'Chapter 4', title: 'Feature Detection & Matching', topics: ['Edges', 'Corners', 'SIFT'] },
      { chapter: 'Chapter 11', title: 'Stereo Correspondence', topics: ['Epipolar Geometry', 'Disparity Maps'] }
    ],
    difficulty: 'Advanced'
  }
];

export const initialRequisitions: BookRequisition[] = [
  {
    id: 'req_01',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    publisher: 'O Reilly Media',
    edition: '1st Edition',
    reason: 'Essential for distributed systems semester project and backend engineering club curriculum.',
    studentName: 'Yash Kumar',
    enrollmentNo: 'BT24GCS007',
    date: '14 Sep 2026',
    status: 'under_review'
  }
];