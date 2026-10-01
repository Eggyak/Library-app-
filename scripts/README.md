# NIIT University LIRC - Topic-to-Book AI Model & Training Pipeline

This directory contains the dataset, scripts, and model training utilities for the NIIT University Library intelligent search system.

The model is designed to solve a specific student need:
> **"When a student gives the name of a topic they are unable to understand, the model returns the list of books and chapters they should use to learn that topic. In the same search bar, it also handles direct book titles and ISBN lookups."**

---

## Files in this Directory

| File | Purpose |
|------|---------|
| `curriculum_dataset.json` | Curriculum topics and student query examples used to recognize learning needs. Legacy textbook mappings are retained as topic metadata, not treated as inventory records. |
| `Report for Mobile APP Testing.xlsx` | Source inventory workbook with 19,516 item rows. |
| `extract_excel_books.py` | Deduplicates workbook item rows by title and exports 1,107 catalog records, including ISBNs, call numbers, locations, and item counts. |
| `nu_library_excel_books.json` | Generated catalog used by training. |
| `train_topic_model.py` | Builds topic-to-workbook candidate mappings and exports the app catalog with topic annotations. |
| `topic_index.json` | Generated topic index with recommendations linked to real workbook book IDs. |

---

## Quick Start: Testing the Model in Terminal

### 1. Regenerate Inventory and Topic Index
```bash
python scripts/extract_excel_books.py
python scripts/train_topic_model.py
```
This will:
- Read the supplied workbook and export the inventory to `scripts/nu_library_excel_books.json` and `nu-library-app/src/data/excelCatalog.json`.
- Match curriculum topic/query terms and course names against real inventory titles, authors, and call numbers.
- Export recommendations to `scripts/topic_index.json` and `nu-library-app/src/data/topicBookIndex.json`.
- Add topic, example query, and chapter-reference fields to recommended books for the app's topic search.

The curriculum query set is self-labeled and its legacy book IDs do not identify workbook holdings, so the script does not report those labels as recommendation accuracy. Candidate matches should be reviewed by library staff before being treated as authoritative.

### 2. Test Specific Queries

**Topic Search (Student Pain Point):**
```bash
python scripts/train_topic_model.py --query "I am unable to understand deadlocks"
```
*Output: Recommends matching NIIT LIRC inventory titles and call numbers. The provided workbook contains Operating Systems holdings but not the Silberschatz title.*

**Deep Learning Query:**
```bash
python scripts/train_topic_model.py --query "I don't understand backpropagation in neural networks"
```
*Output: Uses matching titles and course/topic signals from the NIIT LIRC workbook; it does not invent books absent from the inventory.*

**ISBN Lookup:**
```bash
python scripts/train_topic_model.py --query "9780134610993"
```
*Output: Exact lookup succeeds only when that ISBN occurs in the workbook inventory.*

### 3. Interactive CLI Console
```bash
python scripts/train_topic_model.py --interactive
```
Type any query interactively and see live matches!

---

## How to Add New Courses and Syllabi

To expand the model with new university subjects (e.g., Computer Graphics, VLSI Design, Bio-informatics):

1. Open `scripts/curriculum_dataset.json`.
2. Add a new topic object under `"topics"`:
```json
{
  "topicId": "top_13",
  "topicName": "Computer Graphics Rasterization & Ray Tracing",
  "category": "Computer Science",
  "course": "Computer Graphics",
  "studentQueries": [
    "I don't understand ray tracing vs rasterization",
    "Bresenham line drawing algorithm",
    "3D perspective projection and viewing frustum"
  ],
  "recommendedBookId": "cat_graphics_01",
  "bookTitle": "Computer Graphics: Principles and Practice",
  "relevantChapters": ["Chapter 3: Rasterization", "Chapter 15: Ray Tracing"],
  "whyRecommended": "Covers mathematical foundations of projection matrices, illumination models, and shader pipelines."
}
```
3. Run `python scripts/train_topic_model.py` to retrain and evaluate the updated model.

---

## Client-Side Integration in the React App

The React + TypeScript application in `nu-library-app/` has this engine embedded directly in:
- `src/services/semanticSearchService.ts`: Real-time query intent detector, ISBN normalizer, and concept ranker.
- `src/components/BookCover.tsx`: Automatic cover image loader via Open Library CDN with high-contrast offline book jackets.
- `src/screens/OpacCatalogScreen.tsx`: Complete UI with topic recommendation callouts, chapter breakdowns, quick prompt buttons, and ISBN status badges.
- `src/screens/StudentDashboard.tsx`: Quick search widget directly on the student home screen.
