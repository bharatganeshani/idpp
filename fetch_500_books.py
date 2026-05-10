import json
import requests
import time
import random

queries = [
    'science fiction', 'history', 'business', 'philosophy', 
    'technology', 'romance', 'thriller', 'biography', 
    'psychology', 'fantasy', 'self-help', 'health', 'travel',
    'poetry', 'education', 'spirituality', 'dystopian',
    'mystery', 'horror', 'finance', 'true crime', 'adventure'
]

books = []
genres = set()
seen_titles = set()

print("Fetching books from Google Books API...")

for q in queries:
    print(f"Fetching category: {q}...")
    for start_idx in [0, 40, 80, 120]: # Pagination
        url = f"https://www.googleapis.com/books/v1/volumes?q=subject:{q}&maxResults=40&startIndex={start_idx}&langRestrict=en"
        try:
            response = requests.get(url, timeout=15)
            data = response.json()
            if 'items' in data:
                for item in data['items']:
                    vol = item.get('volumeInfo', {})
                    title = vol.get('title', '')
                    
                    # Deduplicate by title
                    if title.lower() in seen_titles:
                        continue
                        
                    authors = ", ".join(vol.get('authors', ['Unknown']))
                    description = vol.get('description', '')
                    
                    # Try to map genre
                    genre_raw = vol.get('categories', [])
                    genre = q.title() if not genre_raw else genre_raw[0].split(' / ')[0]
                    if genre == 'Fiction':
                        genre = q.title() # Prefer our specific query over generic "Fiction"
                    
                    year_raw = vol.get('publishedDate', '')
                    year = 0
                    if year_raw:
                        try:
                            year = int(year_raw[:4])
                        except:
                            pass
                    
                    pages = vol.get('pageCount', random.randint(150, 450))
                    rating = vol.get('averageRating', round(random.uniform(3.5, 4.9), 1))
                    
                    # Only keep books that have a description
                    if title and description and len(description) > 50:
                        books.append({
                            'title': title,
                            'author': authors,
                            'description': description.replace('\n', ' ').replace('\r', ' '),
                            'genre': genre,
                            'year': year,
                            'pages': pages,
                            'rating': float(rating)
                        })
                        genres.add(genre)
                        seen_titles.add(title.lower())
        except Exception as e:
            print(f"Error fetching {q} at {start_idx}: {e}")
        time.sleep(0.5)
        
        if len(books) > 600:
            break
    if len(books) > 600:
        break

print(f"\nSuccessfully collected {len(books)} books across {len(genres)} genres!")

data = {
    "genres": sorted(list(genres)),
    "books": books
}

output_path = 'c:\\idpp-main\\frontend\\books_data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved to: {output_path}")
