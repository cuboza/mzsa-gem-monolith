import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin
import re

BASE_URL = 'https://go-rm.ru/'
IGNORE_PAGES = [
    'contacts.html', 'offers.html', 'warranty.html', 'rm_finservice.html', 
    'business.html', 'customerinfo.html', 'dealers.html', 'person.html', 
    'becomeadealer.html', 'about.html', 'personal_data.html', 'career.html', 
    'buy.html', 'askaquestion.html', 'newscontainer.html', 'press.html', 
    'requisites.html', 'index.html', 'search', 'cargobed.html'
]

def get_soup(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        response.encoding = 'utf-8'
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_dimensions(soup):
    # Look for table rows with dimensions
    dims = {'length': 0, 'width': 0, 'height': 0, 'weight': 0}
    
    # Try to find the specs table
    # Usually in _data.html
    for tr in soup.find_all('tr'):
        text = tr.get_text(strip=True).lower()
        
        # Combined dimensions: "Габаритные размеры: Д/Ш/В, мм" -> "2438/1234/1558"
        # Also "Габариты снегохода"
        if ('габаритные размеры' in text or 'габариты' in text) and '/' in text:
            # Find the value cell (usually the second td)
            tds = tr.find_all('td')
            if len(tds) >= 2:
                val_text = tds[1].get_text(strip=True)
                # Parse "2438/1234/1558"
                parts = re.findall(r'\d+', val_text)
                if len(parts) >= 3:
                    dims['length'] = int(parts[0])
                    dims['width'] = int(parts[1])
                    dims['height'] = int(parts[2])
        
        # Handle "3275×1270×1440" format (with x or ×)
        if ('габаритные размеры' in text or 'габариты' in text) and ('x' in text or '×' in text or 'х' in text):
             tds = tr.find_all('td')
             if len(tds) >= 2:
                val_text = tds[1].get_text(strip=True)
                parts = re.findall(r'\d+', val_text)
                if len(parts) >= 3:
                    dims['length'] = int(parts[0])
                    dims['width'] = int(parts[1])
                    dims['height'] = int(parts[2])
        
        # Separate dimensions (fallback)
        # Length
        if 'длина' in text and 'без стекла' not in text and dims['length'] == 0: 
             nums = re.findall(r'\d+', text)
             if nums:
                 dims['length'] = int(nums[-1])
        
        # Width
        if 'ширина' in text and dims['width'] == 0:
             nums = re.findall(r'\d+', text)
             if nums:
                 dims['width'] = int(nums[-1])

        # Height
        if 'высота' in text and dims['height'] == 0:
             nums = re.findall(r'\d+', text)
             if nums:
                 dims['height'] = int(nums[-1])
                 
        # Weight (Dry weight usually)
        if ('сухая масса' in text or 'масса' in text) and 'кг' in text:
             # Avoid "mass of trailer" etc.
             nums = re.findall(r'\d+', text)
             if nums:
                 # Usually the last number is the value
                 dims['weight'] = int(nums[-1])

    return dims

def scrape_product(url, model_name):
    print(f"Scraping {model_name} ({url})...")
    soup = get_soup(url)
    if not soup:
        return None

    # 1. Image
    # Look for side view image or main image
    image_url = ""
    # Try to find image in "ВНЕШНИЙ ВИД" or similar
    # Based on fetch_webpage, images are in assets/images/catalog/...
    
    # Simple heuristic: find the largest image or specific class
    # Or look for the "side" image which is often used in configurators
    
    # Let's try to find an image that contains 'side' in src
    images = soup.find_all('img')
    for img in images:
        src = img.get('src', '')
        if 'side' in src.lower():
            image_url = urljoin(BASE_URL, src)
            break
    
    if not image_url:
        # Fallback to first large image in content
        for img in images:
            src = img.get('src', '')
            alt = img.get('alt', '').lower()
            # Check if alt contains model name
            if model_name.lower() in alt:
                 image_url = urljoin(BASE_URL, src)
                 break
            
            if ('catalog' in src or 'upload/iblock' in src) and 'logo' not in src and 'icon' not in src:
                image_url = urljoin(BASE_URL, src)
                # Don't break immediately, prefer one with model name, but keep this as candidate
                # Actually, let's just take the first one that looks like a product image if we haven't found one with alt text
                if not image_url: 
                    image_url = urljoin(BASE_URL, src)
    
    # 2. Dimensions
    # Construct data URL
    data_url = url.replace('.html', '_data.html')
    data_soup = get_soup(data_url)
    
    dims = {'length': 0, 'width': 0, 'height': 0, 'weight': 0}
    if data_soup:
        dims = parse_dimensions(data_soup)
    
    # If dimensions are missing, try to parse from main page (sometimes they are there)
    if dims['length'] == 0:
        dims = parse_dimensions(soup)

    return {
        "brand": "Русская механика",
        "model": model_name,
        "length": dims['length'],
        "width": dims['width'],
        "height": dims['height'],
        "weight": dims['weight'],
        "image": image_url,
        "url": url
    }

def main():
    soup = get_soup(BASE_URL)
    if not soup:
        return

    products = []
    seen_urls = set()

    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        
        if not href.endswith('.html'):
            continue
            
        if any(ignore in href for ignore in IGNORE_PAGES):
            continue
            
        full_url = urljoin(BASE_URL, href)
        
        if full_url in seen_urls:
            continue
            
        # Heuristic: Product links usually have a price or specific model name
        # And they are at the root level (e.g. https://go-rm.ru/model.html)
        # We filter out deep links if any, but here they seem to be root
        
        # Clean up model name (remove price)
        # "Фронтьер 1000 / 20251 500 0001 149 000 ₽" -> "Фронтьер 1000 / 2025"
        # "РМ 800 Т1 200 000 ₽" -> "РМ 800 Т"
        
        # Regex to remove price (digits + space + ₽)
        clean_name = re.sub(r'[\d\s]+₽.*', '', text).strip()
        if not clean_name:
            clean_name = text

        # Skip if name is too generic or empty
        if len(clean_name) < 3:
            continue

        seen_urls.add(full_url)
        
        product_data = scrape_product(full_url, clean_name)
        if product_data and product_data['length'] > 0: # Only add if we found dimensions
            products.append(product_data)
        
        time.sleep(0.5) # Be polite

    # Save to JSON
    with open('scraper/vehicles_rm.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"Scraped {len(products)} vehicles.")

if __name__ == '__main__':
    main()
