import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
import shutil

import mimetypes

BASE_URL = "https://www.mzsa.ru"
OUTPUT_DIR = "output"

def get_soup(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        # Fix encoding
        response.encoding = response.apparent_encoding 
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def sanitize_filename(name):
    return re.sub(r'[<>:"/\\|?*]', '_', name).strip()

def transliterate(text):
    mapping = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        ' ': '_', '-': '_'
    }
    result = []
    for char in text.lower():
        if char in mapping:
            result.append(mapping[char])
        elif char.isalnum():
            result.append(char)
        else:
            result.append('_')
    return re.sub(r'_+', '_', ''.join(result)).strip('_')

def download_image(url, folder, base_name=None):
    if not url:
        return None
    try:
        # Basic filename from URL
        original_filename = os.path.basename(url).split('?')[0]
        name, ext = os.path.splitext(original_filename)
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        if not ext:
            content_type = response.headers.get('content-type')
            if content_type:
                ext = mimetypes.guess_extension(content_type)
                if ext == '.jpe': ext = '.jpg' # Prefer jpg
            if not ext:
                ext = '.jpg' # Default fallback
        
        if base_name:
            filename = f"{base_name}{ext}"
        else:
            filename = f"{name}{ext}"
            
        final_filepath = os.path.join(folder, filename)

        # Avoid re-downloading if exists
        if os.path.exists(final_filepath):
            return filename

        with open(final_filepath, 'wb') as f:
            shutil.copyfileobj(response.raw, f)
        return filename
    except Exception as e:
        print(f"Error downloading image {url}: {e}")
        return None

def parse_product_page(url):
    soup = get_soup(url)
    if not soup:
        return None

    product = {}
    product['url'] = url

    # Title
    h2 = soup.find('h2')
    if h2:
        product['title'] = h2.get_text(strip=True)
    else:
        product['title'] = "Unknown Product"

    # Basic Info (Model, Version, Price)
    # Search in all list items first
    for li in soup.find_all('li'):
        text = li.get_text(" ", strip=True)
        if "Наименование" in text:
            product['model'] = text.replace("Наименование", "").strip()
        elif "Исполнение" in text:
            product['version'] = text.replace("Исполнение", "").strip()
        elif "Цена:" in text:
            # "Цена: 58 800 руб."
            price_text = text.replace("Цена:", "").replace("руб.", "").replace(" ", "").strip()
            try:
                product['price'] = int(price_text)
            except:
                product['price'] = price_text
    
    # Fallback for Model if not found in li
    if 'model' not in product:
        # Try to extract from title
        # Title often: "Прицеп МЗСА 817701.012"
        title = product.get('title', '')
        match = re.search(r'МЗСА\s+([0-9A-Z\.]+)', title)
        if match:
            product['model'] = f"МЗСА {match.group(1)}"
            # Version might be part of it or separate
            # If title is "Прицеп МЗСА 817701.012", model is 817701.012
            # Sometimes version is separate.
            
    if 'version' not in product:
         # Try to find version in title or elsewhere
         # Often version is the last part of the model number like .012
         if 'model' in product:
             parts = product['model'].split('.')
             if len(parts) > 1:
                 product['version'] = parts[-1]

    # Fallback for price if not found in li (sometimes it's in a div or p)
    if 'price' not in product:
        price_tag = soup.find(lambda tag: tag.name in ['div', 'p'] and "Цена:" in tag.get_text())
        if price_tag:
            text = price_tag.get_text(" ", strip=True)
            # Extract digits
            match = re.search(r'Цена:\s*([\d\s]+)\s*руб', text)
            if match:
                try:
                    product['price'] = int(match.group(1).replace(" ", ""))
                except:
                    pass

    # Description
    # Usually in <div class="text"> or similar
    # Looking for the first substantial text block after h2 or h1
    description_div = soup.find('div', class_='text')
    if description_div:
        # Get text but preserve some structure if needed, or just plain text
        # Let's get paragraphs
        paragraphs = [p.get_text(strip=True) for p in description_div.find_all('p') if p.get_text(strip=True)]
        if paragraphs:
            product['description'] = "\n\n".join(paragraphs)
        else:
             product['description'] = description_div.get_text(strip=True)
    else:
        product['description'] = ""

    # Specs
    specs = {}
    # Find the header
    specs_header = soup.find(lambda tag: tag.name == "h3" and "Технические характеристики" in tag.get_text())
    if specs_header:
        # The list should be the next sibling, or close to it
        current = specs_header.find_next_sibling()
        while current:
            if current.name == 'h3':
                break
            if current.name == 'ul':
                for li in current.find_all('li'):
                    # "Name Value"
                    # Often <strong>Name</strong> Value
                    strong = li.find('strong')
                    if strong:
                        key = strong.get_text(strip=True)
                        value = li.get_text(" ", strip=True).replace(key, "").strip()
                        specs[key] = value
                    else:
                        pass
                break # Found the specs list
            elif current.name == 'dl':
                dts = current.find_all('dt')
                dds = current.find_all('dd')
                for dt, dd in zip(dts, dds):
                    key = dt.get_text(strip=True)
                    value = dd.get_text(strip=True)
                    specs[key] = value
                break
            current = current.find_next_sibling()
    product['specs'] = specs

    # Options
    options = []
    options_header = soup.find(lambda tag: tag.name == "h3" and "Дополнительное оборудование" in tag.get_text())
    if options_header:
        # Iterate through siblings until the next section
        current = options_header.find_next_sibling()
        while current:
            if current.name == 'div':
                # Check if this div contains an option
                # It might have an h3 or h4 with the name
                opt_h = current.find(['h3', 'h4'])
                if opt_h:
                    opt_name = opt_h.get_text(strip=True)
                    # Skip if it's not an option (e.g. some other header)
                    if opt_name in ["Ваша заявка", "Сравнить с другими моделями"]:
                        break

                    option = {'name': opt_name}

                    # SKU / Number
                    text = current.get_text(" ", strip=True)
                    sku_match = re.search(r'Номер:\s*(\d+)', text)
                    if sku_match:
                        option['sku'] = sku_match.group(1)
                    
                    # Try to find high-res image link in the header or nearby
                    # The header might contain an <a> tag
                    opt_link = opt_h.find('a')
                    if opt_link and 'href' in opt_link.attrs:
                        href = opt_link['href']
                        if 'netcat_files' in href or 'images' in href:
                             if href.startswith('/'):
                                 href = BASE_URL + href
                             option['image_url'] = href

                    # If not found in header, look for img tag as fallback
                    if 'image_url' not in option:
                        img = current.find('img')
                        if img:
                            # Check if img is wrapped in a link
                            parent_a = img.find_parent('a')
                            if parent_a and 'href' in parent_a.attrs:
                                href = parent_a['href']
                                if 'netcat_files' in href or 'images' in href:
                                     if href.startswith('/'):
                                         href = BASE_URL + href
                                     option['image_url'] = href
                            
                            # Fallback to src if no link
                            if 'image_url' not in option:
                                src = img.get('src')
                                if src:
                                    if src.startswith('/'):
                                        src = BASE_URL + src
                                    option['image_url'] = src
                    
                    # Price
                    text = current.get_text(" ", strip=True)
                    if "Цена:" in text:
                        price_part = text.split("Цена:")[1].strip()
                        match = re.search(r'([\d\s]+)', price_part)
                        if match:
                            try:
                                option['price'] = int(match.group(1).replace(" ", ""))
                            except:
                                pass
                    
                    # Description
                    # Look for p tags or text nodes that don't contain "Цена" or "Номер"
                    # The structure is often loose.
                    desc_text = []
                    # Get all text but exclude the header and price/sku lines if possible
                    # A simple heuristic: p tags that are not price/sku
                    for p in current.find_all('p'):
                        pt = p.get_text(strip=True)
                        if "Цена:" not in pt and "Номер:" not in pt:
                            desc_text.append(pt)
                    
                    if desc_text:
                        option['description'] = "\n".join(desc_text)
                    
                    options.append(option)
            
            current = current.find_next_sibling()

    product['options'] = options

    # Images
    images = []
    # Find main gallery
    # Look for high-res links first (netcat_files with h_)
    # Also look for standard image links
    for a in soup.find_all('a', href=True):
        href = a['href']
        # Check for high-res marker 'h_' in netcat_files or standard image extensions
        is_image = False
        if 'netcat_files' in href and '/h_' in href:
            is_image = True
        elif href.lower().endswith(('.jpg', '.jpeg', '.png')):
            if 'images' in href or 'netcat_files' in href:
                is_image = True
        
        if is_image:
            if href.startswith('/'):
                href = BASE_URL + href
            if href not in images:
                images.append(href)
    
    product['image_urls'] = images

    product['specs'] = normalize_specs(product['specs'])

    return product

def normalize_specs(specs):
    normalized = {}
    for key, value in specs.items():
        # Clean key and value
        key = key.strip().rstrip(':')
        value = value.strip()
        
        # Dimensions: 2945×1550×775 мм -> 2945x1550x775 mm
        value = value.replace('×', 'x')
        
        # Try to extract numeric value
        # "750 kg" -> 750
        # "2945x1550x775 mm" -> keep as string
        
        # Check if it looks like a simple number with unit
        # Regex for number at start
        match = re.match(r'^(\d+([.,]\d+)?)\s*([а-яА-Яa-zA-Z]+)?$', value)
        if match:
            num_str = match.group(1).replace(',', '.')
            unit = match.group(3)
            try:
                if '.' in num_str:
                    num_val = float(num_str)
                else:
                    num_val = int(num_str)
                
                # Store raw value but also normalized if needed
                # For now, let's just keep the string representation clean
                # Or return a structured object?
                # The user asked for "normalized data".
                # Let's try to be smart.
                
                # If key implies weight/capacity, we want int
                if any(k in key.lower() for k in ['масса', 'грузоподъемность', 'нагрузка']):
                     normalized[key] = num_val
                     normalized[f"{key}_unit"] = unit if unit else 'kg' # assume kg if missing?
                else:
                     normalized[key] = value
            except:
                normalized[key] = value
        else:
            normalized[key] = value
            
        # Dimensions parsing (L x W x H)
        # e.g. "9139x2410x1326 mm"
        if 'x' in value and any(k in key.lower() for k in ['размеры', 'габариты', 'кузов']):
             try:
                 # Remove unit for splitting
                 val_clean = re.sub(r'[^\dx]+', '', value)
                 parts = val_clean.split('x')
                 dims = [int(p) for p in parts if p.isdigit()]
                 
                 if len(dims) >= 2:
                     normalized[f"{key}_length"] = dims[0]
                     normalized[f"{key}_width"] = dims[1]
                 if len(dims) >= 3:
                     normalized[f"{key}_height"] = dims[2]
             except:
                 pass
            
    return normalized

def process_product(product, category_name=""):
    if not product:
        return

    # Create folder structure
    # User requested: model version type latin
    # We use transliterate on the whole string
    
    model = product.get('model', '').replace('МЗСА', 'mzsa').strip()
    version = product.get('version', '').strip()
    
    # Construct folder name
    folder_raw = f"{model} {version} {category_name}"
    folder_name = transliterate(folder_raw)
    
    product_dir = os.path.join(OUTPUT_DIR, folder_name)
    images_dir = os.path.join(product_dir, "images")
    options_images_dir = os.path.join(product_dir, "options_images")

    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(options_images_dir, exist_ok=True)

    # Download product images
    local_images = []
    for i, url in enumerate(product.get('image_urls', [])):
        # Name: model_version_i
        name_part = f"{model}_{version}"
        if i > 0:
            name_part += f"_{i}"
        base_name = transliterate(name_part)
        filename = download_image(url, images_dir, base_name)
        if filename:
            local_images.append(os.path.join("images", filename))
    product['images'] = local_images
    
    # Download option images
    for opt in product.get('options', []):
        if 'image_url' in opt:
            # Name: optname_sku
            sku = opt.get('sku', '')
            name_part = opt['name']
            if sku:
                name_part += f"_{sku}"
            base_name = transliterate(name_part)
            filename = download_image(opt['image_url'], options_images_dir, base_name)
            if filename:
                opt['image'] = os.path.join("options_images", filename)
            del opt['image_url'] # Remove remote URL

    # Save JSON (Single file with options included)
    del product['image_urls'] # Remove remote URLs list

    with open(os.path.join(product_dir, "product.json"), 'w', encoding='utf-8') as f:
        json.dump(product, f, ensure_ascii=False, indent=2)
    
    print(f"Processed {folder_name}")

def scrape_category(category_url, category_name):
    soup = get_soup(category_url)
    if not soup:
        return []

    # Find product links
    links = set()
    for a in soup.find_all('a', href=True):
        href = a['href']
        if '/goods/' in href and href.endswith('.html'):
            full_url = BASE_URL + href if href.startswith('/') else href
            links.add(full_url)
    
    print(f"Found {len(links)} products in {category_url} ({category_name})")
    
    for link in links:
        print(f"Scraping {link}...")
        product = parse_product_page(link)
        if product:
            process_product(product, category_name)
        time.sleep(1) # Be polite

if __name__ == "__main__":
    # Categories: Board (common), Water (water), Vans (commercial)
    categories = [
        ("bortovoy", "https://www.mzsa.ru/goods/common/"),
        ("lodochniy", "https://www.mzsa.ru/goods/water/"),
        ("furgon", "https://www.mzsa.ru/goods/commercial/") 
    ]

    for cat_name, cat_url in categories:
        print(f"--- Scraping category: {cat_name} ---")
        scrape_category(cat_url, cat_name)
    
    print("Done.")
