import json
import mimetypes
import os
import re
import shutil
import time
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.mzsa.ru"
OUTPUT_DIR = "output"

CATEGORY_PREFIXES = {
    "lodochniy": "pritsep_lodka",
    "bortovoy": "pritsep_bort",
    "furgon": "pritsep_furgon",
}


def get_soup(url: str) -> Optional[BeautifulSoup]:
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        response.encoding = response.apparent_encoding
        return BeautifulSoup(response.text, "html.parser")
    except Exception as exc:
        print(f"Error fetching {url}: {exc}")
        return None


def transliterate(text: str) -> str:
    mapping = {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "yo",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "y",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "kh",
        "ц": "ts",
        "ч": "ch",
        "ш": "sh",
        "щ": "shch",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
        " ": "_",
        "-": "_",
    }
    result: List[str] = []
    for char in text.lower():
        if char in mapping:
            result.append(mapping[char])
        elif char.isalnum():
            result.append(char)
        else:
            result.append("_")
    return re.sub(r"_+", "_", "".join(result)).strip("_")


def parse_length_to_mm(raw_value: Optional[object]) -> Optional[int]:
    if raw_value is None:
        return None
    if isinstance(raw_value, (int, float)):
        value = float(raw_value)
        if value <= 0:
            return None
        if value < 100:  # assume meters
            return int(round(value * 1000))
        return int(round(value))

    text = str(raw_value).strip().lower()
    if not text:
        return None

    match = re.findall(r"[\d.,]+", text)
    if not match:
        return None

    number_str = match[0].replace(",", ".")
    try:
        value = float(number_str)
    except ValueError:
        return None

    if "мм" in text or "mill" in text or value > 100:
        return int(round(value))
    if "см" in text:
        return int(round(value * 10))
    if "м" in text:
        return int(round(value * 1000))
    return int(round(value))


def extract_boat_length_mm(specs: Dict[str, object]) -> Optional[int]:
    keys = [
        "dlina_sudna",
        "dlina_sudna_mm",
        "maksimalnaya_dlina_lodki",
        "maksimalnaya_dlina_sudna",
    ]
    for key in keys:
        if key in specs:
            mm_value = parse_length_to_mm(specs[key])
            if mm_value:
                return mm_value
    return None


def format_length_tag(mm_value: Optional[int]) -> Optional[str]:
    if not mm_value:
        return None
    meters = mm_value / 1000
    meters_str = f"{meters:.2f}".rstrip("0").rstrip(".")
    return meters_str.replace(".", "_") + "m"


def build_product_image_basename(
    product: Dict[str, object],
    category_name: str,
    boat_length_mm: Optional[int],
) -> str:
    prefix = CATEGORY_PREFIXES.get(category_name, f"pritsep_{category_name}")
    model_tag = transliterate(str(product.get("model", "")))
    slug = transliterate(str(product.get("slug", "")))
    length_tag = format_length_tag(boat_length_mm)

    parts = [prefix]
    if model_tag:
        parts.append(model_tag)
    elif slug:
        parts.append(slug)
    
    # Ensure model is always part of the name if available
    if model_tag and model_tag not in parts:
         parts.append(model_tag)

    version_tag = transliterate(str(product.get("version", "")))
    if version_tag and version_tag not in model_tag:
        parts.append(version_tag)
    if length_tag:
        parts.append(length_tag)

    base_name = "_".join(part for part in parts if part)
    return re.sub(r"_+", "_", base_name).strip("_") or prefix


def download_image(url: str, folder: str, base_name: Optional[str] = None) -> Optional[str]:
    if not url:
        return None
    try:
        original_filename = os.path.basename(url).split("?")[0]
        name, ext = os.path.splitext(original_filename)

        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        if not ext:
            content_type = response.headers.get("content-type")
            if content_type:
                ext = mimetypes.guess_extension(content_type) or ""
                if ext == ".jpe":
                    ext = ".jpg"
            if not ext:
                ext = ".jpg"

        filename = f"{base_name or name}{ext}"
        final_path = os.path.join(folder, filename)

        if os.path.exists(final_path):
            return filename

        with open(final_path, "wb") as handler:
            shutil.copyfileobj(response.raw, handler)
        return filename
    except Exception as exc:
        print(f"Error downloading image {url}: {exc}")
        return None


def normalize_specs(specs: Dict[str, str]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for key, value in specs.items():
        clean_key = key.strip().rstrip(":")
        transliterated_key = transliterate(clean_key)
        clean_value = value.strip().replace("×", "x")

        match = re.match(r"^(\d+([.,]\d+)?)\s*([а-яА-Яa-zA-Z]+)?$", clean_value)
        if match:
            num = match.group(1).replace(",", ".")
            unit = match.group(3)
            try:
                number = float(num) if "." in num else int(num)
                if any(token in clean_key.lower() for token in ["масса", "груз", "нагруз"]):
                    normalized[transliterated_key] = number
                    normalized[f"{transliterated_key}_unit"] = unit or "kg"
                else:
                    normalized[transliterated_key] = clean_value
            except ValueError:
                normalized[transliterated_key] = clean_value
        else:
            normalized[transliterated_key] = clean_value

        if "x" in clean_value and any(token in clean_key.lower() for token in ["размер", "габарит"]):
            digits = re.sub(r"[^0-9x]", "", clean_value)
            parts = [int(part) for part in digits.split("x") if part.isdigit()]
            if len(parts) >= 2:
                normalized[f"{transliterated_key}_length"] = parts[0]
                normalized[f"{transliterated_key}_width"] = parts[1]
            if len(parts) >= 3:
                normalized[f"{transliterated_key}_height"] = parts[2]
    return normalized


def parse_product_page(url: str) -> Optional[Dict[str, object]]:
    soup = get_soup(url)
    if not soup:
        return None

    product: Dict[str, object] = {"url": url}

    title_tag = soup.find("h2")
    product["title"] = title_tag.get_text(strip=True) if title_tag else "Unknown Product"

    for li in soup.find_all("li"):
        text = li.get_text(" ", strip=True)
        if "Наименование" in text:
            product["model"] = text.replace("Наименование", "").strip()
        elif "Исполнение" in text:
            product["version"] = text.replace("Исполнение", "").strip()
        elif "Цена:" in text:
            price_text = text.replace("Цена:", "").replace("руб.", "").replace(" ", "").strip()
            try:
                product["price"] = int(price_text)
            except ValueError:
                product["price"] = price_text

    if "model" not in product:
        match = re.search(r"МЗСА\s+([0-9A-Z\.]+)", product.get("title", ""))
        if match:
            product["model"] = f"МЗСА {match.group(1)}"

    # Fallback: Try to find model in image alt text
    if "model" not in product:
        for img in soup.find_all("img", alt=True):
            alt_text = img["alt"]
            if "МЗСА" in alt_text:
                match = re.search(r"(МЗСА\s+[0-9A-Z\.]+)", alt_text)
                if match:
                    product["model"] = match.group(1)
                    # Try to extract version from alt text too
                    if "исп." in alt_text:
                        ver_match = re.search(r"исп\.\s*(\d+)", alt_text)
                        if ver_match:
                            product["version"] = ver_match.group(1)
                    break

    if "version" not in product and product.get("model"):
        parts = str(product["model"]).split(".")
        if len(parts) > 1 and parts[-1].isdigit():
            product["version"] = parts[-1]

    if "price" not in product:
        price_tag = soup.find(lambda tag: tag.name in ["div", "p"] and "Цена:" in tag.get_text())
        if price_tag:
            text = price_tag.get_text(" ", strip=True)
            match = re.search(r"Цена:\s*([\d\s]+)\s*руб", text)
            if match:
                try:
                    product["price"] = int(match.group(1).replace(" ", ""))
                except ValueError:
                    pass

    description_block = soup.find("div", id="model_desc")
    if not description_block:
        description_block = soup.find("div", class_="text")

    if description_block:
        raw_desc = description_block.get_text("\n\n", strip=True)
        garbage_phrase = "Заказать\n\nКоличество:\n\nСравнить с другими моделями\n\nЗаказать звонок менеджера\n\nВаше мнение/пожелания\n\nНайти продавца в вашем регионе"
        product["description"] = raw_desc.replace(garbage_phrase, "").strip()
    else:
        product["description"] = ""

    specs: Dict[str, str] = {}

    specs_header = soup.find(lambda tag: tag.name == "h3" and "Технические характеристики" in tag.get_text())
    if specs_header:
        current = specs_header.find_next_sibling()
        while current:
            if current.name == "h3":
                break
            if current.name == "ul":
                for li in current.find_all("li"):
                    strong = li.find("strong")
                    if strong:
                        key = strong.get_text(strip=True)
                        value = li.get_text(" ", strip=True).replace(key, "").strip()
                        specs[key] = value
                break
            if current.name == "dl":
                for dt, dd in zip(current.find_all("dt"), current.find_all("dd")):
                    specs[dt.get_text(strip=True)] = dd.get_text(strip=True)
                break
            current = current.find_next_sibling()
    product["specs"] = normalize_specs(specs)

    excluded_urls = set()
    options: List[Dict[str, str]] = []
    options_header = soup.find(lambda tag: tag.name == "h3" and "Дополнительное оборудование" in tag.get_text())
    if options_header:
        current = options_header.find_next_sibling()
        while current:
            if current.name == "div":
                # Collect all potential image links in this option block to exclude them later
                for a_tag in current.find_all("a", href=True):
                    href = a_tag["href"]
                    if href.startswith("/"):
                        href = BASE_URL + href
                    excluded_urls.add(href)
                
                for img_tag in current.find_all("img", src=True):
                    src = img_tag["src"]
                    if src.startswith("/"):
                        src = BASE_URL + src
                    excluded_urls.add(src)

                opt_header = current.find(["h3", "h4"])
                if opt_header:
                    opt_name = opt_header.get_text(strip=True)
                    if opt_name in ["Ваша заявка", "Сравнить с другими моделями"]:
                        break

                    option: Dict[str, str] = {"name": opt_name}
                    text = current.get_text(" ", strip=True)
                    sku_match = re.search(r"Номер:\s*(\d+)", text)
                    if sku_match:
                        option["sku"] = sku_match.group(1)

                    anchor = opt_header.find("a")
                    if anchor and anchor.get("href"):
                        href = anchor["href"]
                        if href.startswith("/"):
                            href = BASE_URL + href
                        option["image_url"] = href

                    if "image_url" not in option:
                        img = current.find("img")
                        if img:
                            parent_a = img.find_parent("a")
                            if parent_a and parent_a.get("href"):
                                href = parent_a["href"]
                                if href.startswith("/"):
                                    href = BASE_URL + href
                                option["image_url"] = href
                            elif img.get("src"):
                                src = img["src"]
                                if src.startswith("/"):
                                    src = BASE_URL + src
                                option["image_url"] = src

                    if "Цена:" in text:
                        match = re.search(r"Цена:\s*([\d\s]+)", text)
                        if match:
                            try:
                                option["price"] = int(match.group(1).replace(" ", ""))
                            except ValueError:
                                pass

                    desc_chunks = []
                    for paragraph in current.find_all("p"):
                        content = paragraph.get_text(strip=True)
                        if "Цена:" not in content and "Номер:" not in content:
                            desc_chunks.append(content)
                    if desc_chunks:
                        option["description"] = "\n".join(desc_chunks)

                    options.append(option)
            current = current.find_next_sibling()
    product["options"] = options

    images: List[str] = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        is_image = False
        if "netcat_files" in href and "/h_" in href:
            is_image = True
        elif href.lower().endswith((".jpg", ".jpeg", ".png")) and ("images" in href or "netcat_files" in href):
            is_image = True

        if is_image:
            if href.startswith("/"):
                href = BASE_URL + href
            
            if href not in images and href not in excluded_urls:
                images.append(href)
    product["image_urls"] = images

    return product


def ensure_model_and_version(product: Dict[str, object]) -> None:
    if not product.get("model"):
        product["model"] = product.get("title") or os.path.basename(product.get("url", ""))
    if not product.get("version") and product.get("model"):
        parts = str(product["model"]).split(".")
        if len(parts) > 1 and parts[-1].isdigit():
            product["version"] = parts[-1]


def build_product_slug(product: Dict[str, object], category_name: str) -> str:
    model = product.get("model")
    version = product.get("version")
    
    slug_base = None
    
    if model:
        slug_base = transliterate(str(model))
    elif product.get("title"):
        slug_base = transliterate(str(product.get("title")))
    else:
        url_name = os.path.basename(product.get("url", "")).split(".")[0]
        if url_name:
            slug_base = transliterate(url_name)

    if slug_base:
        if version:
            ver_slug = transliterate(str(version))
            # Avoid duplication if version is already part of model name (e.g. if model was "Model 011")
            # We check if it's a distinct part separated by underscores
            if ver_slug and ver_slug not in slug_base.split("_"): 
                 slug_base = f"{slug_base}_{ver_slug}"
        return slug_base

    fallback = transliterate(f"{category_name}_{int(time.time())}")
    return fallback or category_name


def ensure_forward_slash(value: Optional[str]) -> Optional[str]:
    return value.replace("\\", "/") if isinstance(value, str) else value


def process_product(product: Optional[Dict[str, object]], category_name: str) -> None:
    if not product:
        return

    ensure_model_and_version(product)
    slug = build_product_slug(product, category_name)

    product["category"] = category_name
    product["slug"] = slug
    product["scraped_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    category_dir = os.path.join(OUTPUT_DIR, category_name)
    product_dir = os.path.join(category_dir, slug)
    images_dir = os.path.join(product_dir, "pricep")
    options_dir = os.path.join(product_dir, "options")

    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(options_dir, exist_ok=True)

    boat_length_mm = extract_boat_length_mm(product.get("specs", {})) if isinstance(product.get("specs"), dict) else None
    base_stub = build_product_image_basename(product, category_name, boat_length_mm)

    option_image_urls = {
        opt.get("image_url")
        for opt in product.get("options", [])
        if isinstance(opt, dict) and opt.get("image_url")
    }
    product_image_urls = [
        url
        for url in product.get("image_urls", [])
        if url and url not in option_image_urls
    ]

    local_images: List[str] = []
    for index, url in enumerate(product_image_urls):
        base_name = f"{base_stub}_{index}" if index else base_stub
        filename = download_image(url, images_dir, base_name)
        if filename:
            local_images.append(ensure_forward_slash(os.path.join("pricep", filename)))
    product["images"] = local_images

    for option in product.get("options", []):
        if isinstance(option, dict) and option.get("image_url"):
            sku = option.get("sku", "")
            option_base = option.get("name", slug)
            if sku:
                option_base = f"{option_base}_{sku}"
            filename = download_image(option["image_url"], options_dir, transliterate(option_base))
            if filename:
                option["image"] = ensure_forward_slash(os.path.join("options", filename))
        if isinstance(option, dict):
            option.pop("image_url", None)

    product.pop("image_urls", None)

    with open(os.path.join(product_dir, f"{slug}.json"), "w", encoding="utf-8") as handler:
        json.dump(product, handler, ensure_ascii=False, indent=2)

    print(f"Processed {category_name}/{slug}")


def scrape_category(category_url: str, category_name: str) -> None:
    soup = get_soup(category_url)
    if not soup:
        return

    links = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "/goods/" in href and href.endswith(".html"):
            full_url = BASE_URL + href if href.startswith("/") else href
            links.add(full_url)

    print(f"Found {len(links)} products in {category_url} ({category_name})")

    for link in sorted(links):
        print(f"Scraping {link}...")
        product = parse_product_page(link)
        if product:
            process_product(product, category_name)
        time.sleep(1)


if __name__ == "__main__":
    categories = [
        ("bortovoy", "https://www.mzsa.ru/goods/common/zincs/"),
        ("lodochniy", "https://www.mzsa.ru/goods/water/"),
        # ("furgon", "https://www.mzsa.ru/goods/van/"),
        # ("kommercheskiy", "https://www.mzsa.ru/goods/commerce/"),
    ]

    for cat_name, cat_url in categories:
        print(f"--- Scraping category: {cat_name} ---")
        scrape_category(cat_url, cat_name)

    print("Done.")
