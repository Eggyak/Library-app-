import openpyxl
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
excel_path = BASE_DIR / "Report for Mobile APP Testing.xlsx"
wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
ws = wb.active

categories_map = {
    "004": "Computer Science & IT",
    "005": "Computer Science & Programming",
    "006": "Artificial Intelligence & Multimedia",
    "510": "Mathematics",
    "518": "Numerical Methods",
    "519": "Probability & Statistics",
    "570": "Biotechnology & Life Sciences",
    "620": "Engineering Sciences",
    "621": "Electronics & Electrical",
    "629": "Control Systems & Robotics",
    "658": "Management & Business",
    "180": "Philosophy & Indian Thought",
    "181": "Indian Knowledge System",
    "294": "Indian Knowledge System",
    "330": "Economics & Finance",
    "332": "Finance & Securities"
}

def guess_category(call_no, title):
    if not call_no:
        call_no = ""
    prefix3 = call_no[:3]
    if prefix3 in categories_map:
        return categories_map[prefix3]
    t = title.lower()
    if any(k in t for k in ["programming", "c++", "java", "linux", "software", "network", "database", "routing", "security", "web"]):
        return "Computer Science"
    if any(k in t for k in ["electronic", "circuit", "telecom", "signal", "communication", "control system"]):
        return "Electronics"
    if any(k in t for k in ["math", "numerical", "algebra", "statistical", "calculus"]):
        return "Mathematics"
    if any(k in t for k in ["chanakya", "vivekananda", "ramcharitmanas", "vedic", "spiritual", "philosophy"]):
        return "Indian Knowledge System"
    if any(k in t for k in ["management", "economics", "startup", "business", "derivative", "equity", "fund"]):
        return "Management & Finance"
    return "General & Engineering"

extracted_books = []
seen_titles = {}

for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    barcode = str(row[0]).strip() if row[0] is not None else ""
    isbn = str(row[1]).strip() if row[1] is not None else ""
    call = str(row[21] or row[3] or "").strip()
    author = str(row[4]).strip() if row[4] is not None else ""
    title = str(row[5]).strip() if row[5] is not None else ""
    pub = str(row[8]).strip() if row[8] is not None else ""
    year = str(row[9]).strip() if row[9] is not None else ""
    loc = str(row[17]).strip() if row[17] is not None else ""

    if not title:
        continue

    norm_title = re.sub(r'[:\s]+$', '', title).strip()
    key = norm_title.lower()

    if key not in seen_titles:
        book_obj = {
            "id": f"nu_bk_{len(seen_titles)+1:04d}",
            "title": norm_title,
            "author": author or "NIIT University Faculty / LIRC",
            "isbn": isbn,
            "isbns": [isbn] if isbn else [],
            "callNumber": call or "LIRC 000",
            "stackLocation": loc if loc and loc != "001" else "Central Library Stack",
            "publisher": pub or "NIIT LIRC",
            "year": year or "2022",
            "copiesAvailable": 1,
            "totalCopies": 1,
            "category": guess_category(call, norm_title),
            "description": f"Official collection in NIIT University Learning & Information Resource Centre (LIRC). Call Number: {call}."
        }
        seen_titles[key] = len(extracted_books)
        extracted_books.append(book_obj)
    else:
        idx = seen_titles[key]
        extracted_books[idx]["totalCopies"] += 1
        extracted_books[idx]["copiesAvailable"] += 1
        if not extracted_books[idx]["isbn"] and isbn:
            extracted_books[idx]["isbn"] = isbn
        if isbn and isbn not in extracted_books[idx]["isbns"]:
            extracted_books[idx]["isbns"].append(isbn)
        if (not extracted_books[idx]["author"] or extracted_books[idx]["author"] == "NIIT") and author:
            extracted_books[idx]["author"] = author

outputs = [
    BASE_DIR / "scripts" / "nu_library_excel_books.json",
    BASE_DIR / "nu-library-app" / "src" / "data" / "excelCatalog.json",
]

for output_path in outputs:
    output_path.write_text(json.dumps(extracted_books, indent=2), encoding="utf-8")

print(f"Extracted {len(extracted_books)} unique books from Excel file.")
for output_path in outputs:
    print(f"Saved to {output_path.relative_to(BASE_DIR)}")
