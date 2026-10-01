#!/usr/bin/env python3
"""
NIIT UNIVERSITY LIRC - Intelligent Multi-Intent Topic & Book Recommendation Model
==================================================================================
This script builds, trains, evaluates, and exports the topic-to-book recommendation model.
It supports:
1. Topic Recommendation: Suggests textbooks for concepts students struggle with.
2. Direct Title/Author Match: Resolves book names or acronyms (e.g., "CLRS").
3. ISBN Lookup: Normalizes and matches 10/13-digit ISBNs.

Usage:
  python train_topic_model.py               # Train, evaluate & export model weights
  python train_topic_model.py --query "I am unable to understand deadlocks"
  python train_topic_model.py --interactive  # Interactive search console
"""

import sys
import os
import json
import math
import re
from typing import List, Dict, Any, Tuple

# Path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FILE = os.path.join(BASE_DIR, "curriculum_dataset.json")
BOOKS_FILE = os.path.join(BASE_DIR, "nu_library_excel_books.json")
OUTPUT_WEIGHTS = os.path.join(BASE_DIR, "topic_index.json")
APP_TOPIC_INDEX = os.path.join(BASE_DIR, "..", "nu-library-app", "src", "data", "topicBookIndex.json")
APP_BOOKS_FILE = os.path.join(BASE_DIR, "..", "nu-library-app", "src", "data", "excelCatalog.json")

TOKEN_STOPWORDS = {"and", "the", "for", "with", "from", "into", "using", "how", "what", "which", "about", "work", "works", "course", "concept", "concepts", "understand", "unable", "learn", "student", "books", "book"}

# Conversational stop phrases to strip from student queries
STOP_PHRASES = [
    r"^i\s+(?:am\s+)?unable\s+to\s+understand\s+",
    r"^i\s+(?:can\'t|cannot|dont|don\'t)\s+understand\s+",
    r"^how\s+(?:to\s+understand|does|do\s+i\s+learn|do\s+we\s+solve)\s+",
    r"^want\s+to\s+learn\s+",
    r"^i\s+want\s+to\s+learn\s+",
    r"^explain\s+(?:to\s+me\s+)?",
    r"^(?:best\s+)?books?\s+(?:for|on)\s+",
    r"^which\s+book\s+(?:should\s+i\s+read|for)\s+",
    r"^concept\s+of\s+",
    r"^what\s+is\s+(?:the\s+)?"
]


def clean_isbn(isbn_str: str) -> str:
    """Removes hyphens, spaces, and non-alphanumeric chars from ISBN."""
    return re.sub(r'[^0-9X]', '', isbn_str.upper())


def is_isbn(query: str) -> bool:
    """Returns True if query matches 10 or 13-digit ISBN pattern."""
    cleaned = clean_isbn(query)
    return bool(re.match(r'^(?:978|979)?\d{9}[\dX]$', cleaned)) or (len(cleaned) in (10, 13) and cleaned[:-1].isdigit())


def clean_query_topic(raw_query: str) -> str:
    """Strips natural language student struggle boilerplate to get the core topic."""
    text = raw_query.strip().lower()
    for pattern in STOP_PHRASES:
        text = re.sub(pattern, '', text).strip()
    return re.sub(r'[?!.,;:]+$', '', text).strip() or raw_query.strip().lower()


class TopicRecommendationEngine:
    def __init__(self, dataset_path: str, books_path: str = BOOKS_FILE):
        self.dataset_path = dataset_path
        self.books_path = books_path
        self.topics = []
        self.books = []
        self.load_dataset()
        self.load_books()
        self.vocabulary = {}
        self.idf = {}
        self.topic_vectors = []
        self.build_index()

    def load_dataset(self):
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.topics = data.get("topics", [])
        print(f"[OK] Loaded {len(self.topics)} university curriculum topics from {self.dataset_path}")

    def load_books(self):
        with open(self.books_path, "r", encoding="utf-8") as f:
            self.books = json.load(f)
        print(f"[OK] Loaded {len(self.books)} unique books from the NIIT LIRC workbook")

    def words(self, text: str) -> set:
        return {word for word in re.findall(r"[a-zA-Z0-9]+", text.lower()) if len(word) > 1 and word not in TOKEN_STOPWORDS}

    def topic_book_matches(self, topic: Dict[str, Any], limit: int = 8) -> List[Dict[str, Any]]:
        topic_terms = self.words(" ".join([
            topic.get("topicName", ""), topic.get("course", ""), topic.get("category", ""),
            " ".join(topic.get("studentQueries", []))
        ]))
        course_terms = self.words(topic.get("course", ""))
        course_title = topic.get("course", "").lower().strip()
        ranked = []
        for book in self.books:
            book_title = book.get("title", "").lower().strip()
            book_text = " ".join([book.get("title", ""), book.get("author", ""), book.get("callNumber", ""), book.get("category", "")])
            book_terms = self.words(book_text)
            overlap = topic_terms & book_terms
            course_overlap = course_terms & book_terms
            score = len(overlap) + 2 * len(course_overlap)
            if course_title and course_title == book_title:
                score += 10
            elif course_title and course_title in book_title:
                score += 4
            if score:
                ranked.append((score, book))
        ranked.sort(key=lambda item: (-item[0], item[1]["title"].lower()))
        return [{
            "bookId": book["id"], "title": book["title"], "score": score,
            "callNumber": book["callNumber"], "stackLocation": book["stackLocation"],
            "isbn": book["isbn"]
        } for score, book in ranked[:limit]]

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r'[a-zA-Z0-9]+', text.lower())
        # Generate unigrams and bigrams
        unigrams = [w for w in words if len(w) > 1]
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        return unigrams + bigrams

    def build_index(self):
        """Constructs TF-IDF / subword representation for dense concept matching."""
        doc_freq = {}
        total_docs = len(self.topics)
        tokenized_docs = []

        for item in self.topics:
            corpus = " ".join([
                item["topicName"],
                item["course"],
                item["category"],
                item.get("whyRecommended", ""),
                " ".join(item.get("studentQueries", []))
            ])
            tokens = self.tokenize(corpus)
            tokenized_docs.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1

        # Calculate IDF
        self.idf = {t: math.log((total_docs + 1) / (df + 1)) + 1.0 for t, df in doc_freq.items()}

        # Build vectors
        for tokens in tokenized_docs:
            vec = {}
            for t in tokens:
                vec[t] = vec.get(t, 0) + 1
            # Normalize with IDF
            norm = math.sqrt(sum((count * self.idf[t]) ** 2 for t, count in vec.items())) or 1.0
            unit_vec = {t: (count * self.idf[t]) / norm for t, count in vec.items()}
            self.topic_vectors.append(unit_vec)

    def query(self, raw_query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Handles any query: ISBN, Book Title, or Student Topic Struggle."""
        cleaned = clean_isbn(raw_query)
        # 1. Check ISBN
        if is_isbn(raw_query):
            return [{"matchType": "isbn", "score": 100.0, "bookTitle": book["title"], "bookId": book["id"], "callNumber": book["callNumber"], "stackLocation": book["stackLocation"]}
                    for book in self.books if cleaned in [clean_isbn(value) for value in book.get("isbns", [book.get("isbn", "")])]]

        # 2. Search the actual workbook catalog for titles and authors.
        query_text = raw_query.strip().lower()
        direct = []
        for book in self.books:
            title = book.get("title", "").lower()
            author = book.get("author", "").lower()
            if query_text and (query_text in title or query_text in author):
                direct.append({"matchType": "title", "score": 100.0 if query_text == title else 90.0, "bookTitle": book["title"], "bookId": book["id"], "callNumber": book["callNumber"], "stackLocation": book["stackLocation"]})
        if direct:
            return direct[:top_k]

        # 3. Match a student query to the curriculum, then recommend workbook titles.
        core_topic = clean_query_topic(raw_query)
        q_tokens = self.tokenize(core_topic)
        q_vec = {}
        for t in q_tokens:
            if t in self.idf:
                q_vec[t] = q_vec.get(t, 0) + 1

        q_norm = math.sqrt(sum((count * self.idf[t]) ** 2 for t, count in q_vec.items())) or 1.0
        q_unit = {t: (count * self.idf[t]) / q_norm for t, count in q_vec.items()}

        scores = []
        for idx, doc_vec in enumerate(self.topic_vectors):
            dot = sum(doc_vec.get(t, 0) * val for t, val in q_unit.items())
            topic_item = self.topics[idx]

            # Boost if exact topic words match in topicName
            if core_topic in topic_item["topicName"].lower():
                dot += 0.5
            # Boost if exact query is in studentQueries
            for sq in topic_item.get("studentQueries", []):
                if core_topic in sq.lower():
                    dot += 0.6
                    break

            scores.append((dot, topic_item))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for s, item in scores[:top_k]:
            if s > 0.05:
                for candidate in self.topic_book_matches(item, top_k):
                    results.append({
                        "matchType": "topic", "score": round(min(s * 100, 99.5), 1),
                        "topicName": item["topicName"], "course": item["course"],
                        "bookTitle": candidate["title"], "bookId": candidate["bookId"],
                        "catalogScore": candidate["score"], "callNumber": candidate["callNumber"],
                        "stackLocation": candidate["stackLocation"],
                        "whyRecommended": f"Related to {item['topicName']} in {item['course']}; matched the NIIT LIRC title, author, or classification."
                    })
                if results:
                    break

        return results

    def evaluate(self):
        """Checks whether curriculum query examples return workbook records."""
        print("\n============= WORKBOOK QUERY COVERAGE =============")
        total_queries = 0
        matched_queries = 0

        for item in self.topics:
            for q in item.get("studentQueries", []):
                total_queries += 1
                res = self.query(q, top_k=3)
                if res:
                    matched_queries += 1

        print(f"Total Student Queries Tested: {total_queries}")
        print(f"Queries returning workbook records: {matched_queries}/{total_queries}")
        print("This is coverage, not a relevance-accuracy measurement. Review matches before relying on them.\n")
        print("==================================================\n")

    def export_index(self, output_path: str):
        """Exports precomputed index for client-side embedding or API usage."""
        export_data = {
            "curriculum": "NIIT University LIRC Topic AI",
            "topics": [{**topic, "catalogRecommendations": self.topic_book_matches(topic)} for topic in self.topics]
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2)
        print(f"[OK] Exported topic index to {output_path}")
        with open(APP_TOPIC_INDEX, "w", encoding="utf-8") as f:
            json.dump(export_data, f, indent=2)
        recommendations_by_book: Dict[str, Dict[str, Any]] = {}
        for topic in export_data["topics"]:
            for recommendation in topic["catalogRecommendations"]:
                metadata = recommendations_by_book.setdefault(recommendation["bookId"], {
                    "topics": [], "keyConcepts": [], "strugglingWith": []
                })
                metadata["topics"].extend([topic["topicName"], topic["course"]])
                metadata["keyConcepts"].extend(topic.get("studentQueries", []))
                metadata["strugglingWith"].extend(topic.get("studentQueries", []))
        app_books = []
        for book in self.books:
            metadata = recommendations_by_book.get(book["id"])
            if metadata:
                for key, values in metadata.items():
                    book[key] = list(dict.fromkeys(values))
            app_books.append(book)
        with open(APP_BOOKS_FILE, "w", encoding="utf-8") as f:
            json.dump(app_books, f, indent=2)
        print(f"[OK] Exported app topic index to {APP_TOPIC_INDEX}")


def main():
    if not os.path.exists(DATASET_FILE):
        print(f"Error: {DATASET_FILE} not found.")
        sys.exit(1)

    engine = TopicRecommendationEngine(DATASET_FILE)
    engine.evaluate()
    engine.export_index(OUTPUT_WEIGHTS)

    # Check for CLI args
    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive":
            print("\n--- NU LIRC Topic & Book Model Interactive CLI ---")
            print("Type a topic (e.g. 'I don't understand deadlocks'), book name, or ISBN.")
            print("Type 'exit' to quit.\n")
            while True:
                try:
                    q = input("Student Query > ").strip()
                    if not q or q.lower() == "exit":
                        break
                    results = engine.query(q)
                    if not results:
                        print("  [!] No matching books found. Try a different topic or book title.")
                    for r in results:
                        print(f"  * Recommended: {r['bookTitle']} ({r['score']}% match)")
                        print(f"    Topic: {r.get('topicName')} | Course: {r.get('course')}")
                        print(f"    Why: {r.get('whyRecommended')}\n")
                except (EOFError, KeyboardInterrupt):
                    break
        elif sys.argv[1] == "--query" and len(sys.argv) > 2:
            query_str = " ".join(sys.argv[2:])
            print(f"\nQuery: '{query_str}'")
            results = engine.query(query_str)
            for r in results:
                print(f"-> {r['bookTitle']} (Score: {r['score']}%)")
                if r.get("whyRecommended"):
                    print(f"   Why: {r['whyRecommended']}")
                print(f"   Call number: {r.get('callNumber', 'Not listed')} | Location: {r.get('stackLocation', 'Not listed')}\n")


if __name__ == "__main__":
    main()
