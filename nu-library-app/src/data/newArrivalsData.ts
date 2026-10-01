export interface NewArrivalBook {
  id: string;
  biblionumber: string;
  title: string;
  author: string;
  callNumber: string;
  shelfLocation: string;
  year: string;
  category: string;
  description: string;
  kohaUrl: string;
}

export const NEW_ARRIVALS_BOOKS: NewArrivalBook[] = [
  {
    id: "na_33609",
    biblionumber: "33609",
    title: "Introduction to Large Language Models: Generative AI for Text",
    author: "Shashank Mohan & Team",
    callNumber: "006.35 MOH",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2024",
    category: "Artificial Intelligence",
    description: "Foundational concepts behind generative pre-trained transformers, attention mechanisms, fine-tuning, and enterprise LLM deployment.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33609"
  },
  {
    id: "na_33614",
    biblionumber: "33614",
    title: "Pro MERN Stack: Full Stack Web App Development with Mongo, Express, React, and Node",
    author: "Vasan Subramanian",
    callNumber: "005.276 SUB",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Software Engineering",
    description: "End-to-end modern JavaScript engineering, single page architectures, REST & GraphQL APIs, and scalable cloud deployments.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33614"
  },
  {
    id: "na_33619",
    biblionumber: "33619",
    title: "Ultimate Docker Container Book: Build, Test, Ship, and Run Containers with Docker and Kubernetes",
    author: "Gabriel N. Schenker",
    callNumber: "005.43 SCH",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Cloud Computing & DevOps",
    description: "Comprehensive guide to microservices orchestration, container security, Docker Compose, and Kubernetes cluster management.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33619"
  },
  {
    id: "na_33613",
    biblionumber: "33613",
    title: "Practical Cyber Forensics: An Incident-Based Approach to Forensic Investigations",
    author: "Niranjan Reddy",
    callNumber: "005.8 RED",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Cybersecurity",
    description: "Investigative workflows for network packet analysis, memory dump forensics, file carving, and digital chain of custody.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33613"
  },
  {
    id: "na_33606",
    biblionumber: "33606",
    title: "Python Programming: Using Problem-Solving Approach",
    author: "Reema Thareja",
    callNumber: "005.133 THA",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Programming",
    description: "Step-by-step algorithms, computational problem solving, data structures, and Python applications in data engineering.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33606"
  },
  {
    id: "na_33601",
    biblionumber: "33601",
    title: "Principles of Distributed Database Systems",
    author: "M. Tamer Ozsu, Patrick Valduriez",
    callNumber: "005.74 OZS",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2022",
    category: "Databases",
    description: "Distributed query processing, transactions, 2PC/3PC consensus, replication algorithms, and modern NoSQL architectures.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33601"
  },
  {
    id: "na_33618",
    biblionumber: "33618",
    title: "Database Security and Auditing: Protecting Data Integrity and Accessibility",
    author: "Hassan A. Afyouni",
    callNumber: "005.8 AFY",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Cybersecurity & Data",
    description: "Data encryption protocols, role-based access controls, SQL injection mitigations, and compliance auditing.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33618"
  },
  {
    id: "na_33623",
    biblionumber: "33623",
    title: "Deep Learning with Python",
    author: "Francois Chollet",
    callNumber: "006.3 CHO",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2022",
    category: "Machine Learning",
    description: "Written by the creator of Keras, providing hands-on insights into neural network architectures, computer vision, and NLP.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33623"
  },
  {
    id: "na_33611",
    biblionumber: "33611",
    title: "Machine Learning for Text and Image Data Analysis: Practical Business Use Cases",
    author: "Alok Kumar & Rajesh Kumar",
    callNumber: "006.31 KUM",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Data Science",
    description: "Industry case studies applying transformer models, image embeddings, sentiment classification, and visual analytics.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33611"
  },
  {
    id: "na_33615",
    biblionumber: "33615",
    title: "Computer Vision: Algorithms and Applications",
    author: "Richard Szeliski",
    callNumber: "006.37 SZE",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2022",
    category: "Computer Vision",
    description: "3D reconstruction, feature detection, object recognition, visual SLAM, and generative diffusion rendering.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33615"
  },
  {
    id: "na_33649",
    biblionumber: "33649",
    title: "Research Methodology: A Step-by-Step Guide for Beginners",
    author: "Ranjit Kumar",
    callNumber: "001.42 KUM",
    shelfLocation: "New Arrivals Display - Shelf 48",
    year: "2023",
    category: "Research",
    description: "Comprehensive guide to formulating research questions, experimental design, qualitative & quantitative data collection.",
    kohaUrl: "https://library.niituniversity.in/cgi-bin/koha/opac-detail.pl?biblionumber=33649"
  }
];
