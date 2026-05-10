import csv
import random
import os

os.makedirs('c:\\idpp-main\\sample_books', exist_ok=True)

with open('c:\\idpp-main\\large_books_dataset.csv', 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))

# Shuffle to get diverse books
random.seed(42)
random.shuffle(reader)

# Save 10 random books as text files
for i, book in enumerate(reader[:10], 1):
    # Clean title for filename
    safe_title = "".join([c if c.isalnum() else "_" for c in book['Title']]).strip('_')
    filename = f"c:\\idpp-main\\sample_books\\dataset_book_{i}_{safe_title[:20]}.txt"
    
    with open(filename, 'w', encoding='utf-8') as out:
        out.write(f"Title: {book['Title']}\n")
        out.write(f"Author: {book['Author']}\n")
        out.write(f"Category: {book['Original_Category']}\n")
        out.write(f"\nDescription:\n{book['Description']}\n")
        
print("10 books have been exported as text files for UI testing!")
