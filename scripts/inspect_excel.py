import openpyxl
import json
import os

excel_path = "Report for Mobile APP Testing.xlsx"
wb = openpyxl.load_workbook(excel_path, read_only=True)
ws = wb.active

titles = {}
isbns_without_title = {}

for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
    barcode = str(row[0]).strip() if row[0] is not None else ""
    isbn = str(row[1]).strip() if row[1] is not None else ""
    author = str(row[4]).strip() if row[4] is not None else ""
    title = str(row[5]).strip() if row[5] is not None else ""
    call = str(row[21] or row[3] or "").strip()
    pub = str(row[8]).strip() if row[8] is not None else ""
    year = str(row[9]).strip() if row[9] is not None else ""
    location = str(row[17]).strip() if row[17] is not None else "Central Library Stack"
    classification = str(row[3]).strip() if row[3] is not None else ""

    if title:
        if title not in titles:
            titles[title] = {
                "title": title,
                "author": author,
                "isbn": isbn,
                "call": call,
                "classification": classification,
                "publisher": pub,
                "year": year,
                "location": location,
                "copies": 1,
                "barcodes": [barcode] if barcode else []
            }
        else:
            titles[title]["copies"] += 1
            if barcode:
                titles[title]["barcodes"].append(barcode)
            if not titles[title]["isbn"] and isbn:
                titles[title]["isbn"] = isbn
            if not titles[title]["author"] and author:
                titles[title]["author"] = author
            if not titles[title]["publisher"] and pub:
                titles[title]["publisher"] = pub
    elif isbn:
        if isbn not in isbns_without_title:
            isbns_without_title[isbn] = {
                "isbn": isbn,
                "author": author,
                "classification": classification,
                "call": call,
                "copies": 1
            }
        else:
            isbns_without_title[isbn]["copies"] += 1

print(f"Total Unique Titles with Title field: {len(titles)}")
print(f"Total Unique ISBNs without Title field: {len(isbns_without_title)}")

print("\n--- SAMPLE TITLES WITH TITLE FIELD (First 35) ---")
for idx, (t, data) in enumerate(list(titles.items())[:35]):
    print(f"{idx+1}. {data['title']} | Author: {data['author']} | ISBN: {data['isbn']} | Call: {data['call']} | Copies: {data['copies']}")

titles_with_isbn = [d for d in titles.values() if d['isbn']]
print(f"\n--- TITLES WITH BOTH TITLE AND ISBN (Total: {len(titles_with_isbn)}) ---")
for idx, b in enumerate(titles_with_isbn[:30]):
    print(f"{idx+1}. {b['title']} | Author: {b['author']} | ISBN: {b['isbn']} | Call: {b['call']} | Copies: {b['copies']}")
