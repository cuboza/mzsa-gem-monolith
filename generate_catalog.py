import json
import os
import shutil
import re

OUTPUT_DIR = "output"
FRONTEND_PUBLIC_IMG_DIR = "frontend/public/images/trailers"
FRONTEND_PUBLIC_OPT_IMG_DIR = "frontend/public/images/options"
FRONTEND_TRAILERS_FILE = "frontend/src/data/trailers.ts"
FRONTEND_ACCESSORIES_FILE = "frontend/src/data/accessories.ts"

# Ensure target image directories exist
if os.path.exists(FRONTEND_PUBLIC_IMG_DIR):
    shutil.rmtree(FRONTEND_PUBLIC_IMG_DIR)
os.makedirs(FRONTEND_PUBLIC_IMG_DIR)

if os.path.exists(FRONTEND_PUBLIC_OPT_IMG_DIR):
    shutil.rmtree(FRONTEND_PUBLIC_OPT_IMG_DIR)
os.makedirs(FRONTEND_PUBLIC_OPT_IMG_DIR)

trailers = []
accessories_map = {} # Map by SKU or Name to avoid duplicates

category_map = {
    "bortovoy": "general",
    "lodochniy": "water",
    "furgon": "commercial"
}

def parse_axles(specs):
    val = specs.get("kol_vo_osey_kolyos", "1")
    if "2" in str(val):
        return 2
    return 1

def get_features(desc):
    features = []
    if desc:
        parts = desc.split("●")
        for part in parts:
            clean = part.strip()
            if clean and len(clean) < 150:
                features.append(clean)
    return features[:6]

def determine_accessory_category(name):
    name_lower = name.lower()
    if "тент" in name_lower or "каркас" in name_lower:
        return "cover"
    if "колесо" in name_lower or "кронштейн" in name_lower or "держатель" in name_lower:
        return "spare"
    if "опорное" in name_lower or "домкрат" in name_lower:
        return "support"
    if "трап" in name_lower or "аппарель" in name_lower:
        return "loading"
    return "safety"

print("Starting catalog generation...")

for category in os.listdir(OUTPUT_DIR):
    cat_path = os.path.join(OUTPUT_DIR, category)
    if not os.path.isdir(cat_path):
        continue
    
    mapped_cat = category_map.get(category, "general")
    print(f"Processing category: {category} -> {mapped_cat}")

    for product_slug in os.listdir(cat_path):
        prod_path = os.path.join(cat_path, product_slug)
        json_file = os.path.join(prod_path, f"{product_slug}.json")
        
        if not os.path.exists(json_file):
            continue
            
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # --- Process Trailer Images ---
        image_path = ""
        all_images = []
        if data.get("images"):
            target_prod_img_dir = os.path.join(FRONTEND_PUBLIC_IMG_DIR, product_slug)
            os.makedirs(target_prod_img_dir, exist_ok=True)
            
            for i, img_rel_path in enumerate(data["images"]):
                src_img = os.path.join(prod_path, img_rel_path)
                if os.path.exists(src_img):
                    filename = os.path.basename(src_img)
                    dst_img = os.path.join(target_prod_img_dir, filename)
                    shutil.copy2(src_img, dst_img)
                    
                    final_path = f"/images/trailers/{product_slug}/{filename}"
                    all_images.append(final_path)
                    
                    if i == 0:
                        image_path = final_path

        specs = data.get("specs", {})
        
        # --- Process Trailer ---
        trailer_id = data["slug"]
        trailer = {
            "id": trailer_id,
            "model": f"{data.get('model', '')}.{data.get('version', '')}",
            "name": data.get("title", ""),
            "category": mapped_cat,
            "price": data.get("price", 0),
            "capacity": specs.get("gruzopodemnost", 0),
            "dimensions": specs.get("razmery_kuzova", ""),
            "boardHeight": specs.get("razmery_kuzova_height", 0),
            "gabarity": specs.get("gabaritnye_razmery", ""),
            "features": get_features(data.get("description", "")),
            "availability": "in_stock",
            "image": image_path,
            "images": all_images,
            "description": data.get("description", ""),
            "specs": {
                "dimensions": specs.get("razmery_kuzova", ""),
                "capacity": f"{specs.get('gruzopodemnost', 0)} кг",
                "weight": f"{specs.get('snaryazhyonnaya_massa', 0)} кг",
                "axles": parse_axles(specs),
                "boardHeight": specs.get("razmery_kuzova_height", 0)
            },
            "suspension": specs.get("podveska", "Рессорная"),
            "brakes": specs.get("tormoz", "Нет")
        }
        
        if mapped_cat == "water":
             for key in ["dlina_sudna_mm", "maksimalnaya_dlina_sudna", "dlina_sudna"]:
                 if key in specs:
                     trailer["bodyDimensions"] = f"{specs[key]} мм судно"
                     break

        trailers.append(trailer)

        # --- Process Accessories ---
        for opt in data.get("options", []):
            sku = opt.get("sku")
            name = opt.get("name")
            if not name:
                continue
                
            # Use SKU as ID if available, else hash name
            acc_id = sku if sku else str(abs(hash(name)))
            
            if acc_id not in accessories_map:
                # Handle Option Image
                opt_image_path = ""
                if opt.get("image"):
                    src_opt_img = os.path.join(prod_path, opt["image"])
                    if os.path.exists(src_opt_img):
                        filename = os.path.basename(src_opt_img)
                        dst_opt_img = os.path.join(FRONTEND_PUBLIC_OPT_IMG_DIR, filename)
                        shutil.copy2(src_opt_img, dst_opt_img)
                        opt_image_path = f"/images/options/{filename}"

                accessories_map[acc_id] = {
                    "id": acc_id,
                    "name": name,
                    "price": opt.get("price", 0),
                    "category": determine_accessory_category(name),
                    "required": False,
                    "image": opt_image_path,
                    "description": opt.get("description", ""),
                    "compatibleWith": [trailer_id]
                }
            else:
                # Add compatibility
                if trailer_id not in accessories_map[acc_id]["compatibleWith"]:
                    accessories_map[acc_id]["compatibleWith"].append(trailer_id)

print(f"Found {len(trailers)} trailers and {len(accessories_map)} accessories.")

# --- Write Trailers File ---
trailers_ts = """import { Trailer } from '../types';

export const allTrailers: Trailer[] = %s;
""" % json.dumps(trailers, ensure_ascii=False, indent=2)

# Clean up JSON to look more like TS (optional, but removing quotes from keys is hard with regex safely)
# We will just stick to valid JSON which is valid TS.

with open(FRONTEND_TRAILERS_FILE, "w", encoding="utf-8") as f:
    f.write(trailers_ts)

# --- Write Accessories File ---
accessories_list = list(accessories_map.values())
accessories_ts = """import { Accessory } from '../types';

export const accessories: Accessory[] = %s;
""" % json.dumps(accessories_list, ensure_ascii=False, indent=2)

with open(FRONTEND_ACCESSORIES_FILE, "w", encoding="utf-8") as f:
    f.write(accessories_ts)

print("Catalog generation complete.")
