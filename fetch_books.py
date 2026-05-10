import csv
import requests
import time

# We'll query the public Google Books API for a variety of genres to build a comprehensive dataset
queries = [
    'science fiction', 'history', 'business', 'philosophy', 
    'technology', 'romance', 'thriller', 'biography', 
    'psychology', 'fantasy', 'self-help', 'health', 'travel'
]

books = []

print("Fetching large book dataset...")

for q in queries:
    print(f"Fetching category: {q}...")
    # Get 20 results per category
    url = f"https://www.googleapis.com/books/v1/volumes?q=subject:{q}&maxResults=20&langRestrict=en"
    try:
        response = requests.get(url, timeout=15)
        data = response.json()
        if 'items' in data:
            for item in data['items']:
                vol = item.get('volumeInfo', {})
                title = vol.get('title', '')
                authors = ", ".join(vol.get('authors', []))
                description = vol.get('description', '')
                categories = ", ".join(vol.get('categories', []))
                
                # Only keep books that have a description (needed for your AI classification)
                if title and description and len(description) > 50:
                    books.append({
                        'Title': title,
                        'Author': authors,
                        'Original_Category': categories,
                        'Description': description.replace('\n', ' ').replace('\r', '')
                    })
    except Exception as e:
        print(f"Error fetching {q}: {e}")
    time.sleep(0.5)

dataset_path = 'c:\\idpp-main\\large_books_dataset.csv'

with open(dataset_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['Title', 'Author', 'Original_Category', 'Description'])
    writer.writeheader()
    writer.writerows(books)

print(f"\nSuccessfully generated dataset with {len(books)} books!")
print(f"Saved to: {dataset_path}")
