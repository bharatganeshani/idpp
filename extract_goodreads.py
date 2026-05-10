import csv
import random
import os

os.makedirs('c:\\idpp-main\\goodreads_samples', exist_ok=True)

with open('c:\\idpp-main\\goodreads_dataset.csv', 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))

# Shuffle to get diverse books
random.seed(123)
random.shuffle(reader)

# Save 10 random books as text files
for i, book in enumerate(reader[:10], 1):
    # Clean title for filename
    title = book.get('title', 'Unknown Title')
    genre = book.get('genre', 'Unknown Genre')
    
    safe_title = "".join([c if c.isalnum() else "_" for c in title]).strip('_')
    filename = f"c:\\idpp-main\\goodreads_samples\\goodreads_{i}_{safe_title[:20]}.txt"
    
    with open(filename, 'w', encoding='utf-8') as out:
        out.write(f"Title: {title}\n")
        out.write(f"Original Goodreads Genre: {genre}\n")
        out.write(f"\nNote: The dataset only provided the title, so we will ask the AI to classify this book based entirely on its title.\n")
        
print("10 books from your Goodreads dataset have been exported as text files!")
