#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCRAPER_OUTPUT_DIR = path.join(ROOT, 'scraper', 'output');
const DB_PATH = path.join(ROOT, 'backend', 'db.json');
const FRONTEND_PUBLIC = path.join(ROOT, 'frontend', 'public');
const TRAILER_IMAGES_DIR = path.join(FRONTEND_PUBLIC, 'images', 'trailers');
const ACCESSORY_IMAGES_DIR = path.join(FRONTEND_PUBLIC, 'images', 'accessories');

const WAREHOUSE_CODES = ['SG-1', 'SG-vitrina', 'Service', 'SG-3', 'NB', 'NV', 'NU'];
const SEGMENT_CATEGORY_MAP = {
  bortovoy: 'general',
  lodochniy: 'water',
  furgon: 'commercial',
  moto: 'moto',
  evakuator: 'wrecker'
};

ensureDir(TRAILER_IMAGES_DIR);
ensureDir(ACCESSORY_IMAGES_DIR);

const productFiles = findProductJsonFiles(SCRAPER_OUTPUT_DIR);
if (productFiles.length === 0) {
  console.error('⚠️  Не найдено ни одного product.json в папке scraper/output');
  process.exit(1);
}

const accessoryMap = new Map();
const trailers = [];

for (const filePath of productFiles) {
  try {
    const trailer = normalizeProduct(filePath, accessoryMap);
    trailers.push(trailer);
  } catch (err) {
    console.error(`Ошибка при обработке ${filePath}: ${err.message}`);
  }
}

const accessories = Array.from(accessoryMap.values());
const db = fs.existsSync(DB_PATH)
  ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  : {};

db.trailers = trailers;
db.accessories = accessories;
db.warehouses = WAREHOUSE_CODES.map(code => ({ id: code, name: code }));

writeJson(DB_PATH, db);
console.log(`✅ Обновлено ${trailers.length} прицепов и ${accessories.length} аксессуаров. Данные сохранены в backend/db.json`);

function normalizeProduct(productFile, accessoryMap) {
  const productDir = path.dirname(productFile);
  const relativeDir = path.relative(SCRAPER_OUTPUT_DIR, productDir);
  const [segment = 'unknown'] = relativeDir.split(path.sep);
  const raw = JSON.parse(fs.readFileSync(productFile, 'utf8'));

  const category = SEGMENT_CATEGORY_MAP[segment] || 'general';
  const model = raw.model || raw.title || 'Без названия';
  const version = raw.version || extractVersionFromModel(model);
  const trailerId = slugify(`mzsa ${model}`);

  const specMap = raw.specs && typeof raw.specs === 'object' ? raw.specs : {};

  const capacity = pickNumber([
    raw.capacity,
    specMap['Грузоподъемность'],
    specMap['Грузоподъемность, кг'],
    specMap['Грузоподъемность (кг)']
  ]);

  const gabarity = firstDefined([
    raw.gabarity,
    specMap['Габаритные размеры'],
    specMap['Габариты']
  ]);

  const bodyDimensions = firstDefined([
    raw.bodyDimensions,
    specMap['Длина судна'],
    specMap['Размер судна'],
    specMap['Размер кузова']
  ]);

  const dimensions = firstDefined([
    raw.dimensions,
    specMap['Размеры кузова'],
    specMap['Внутренние размеры']
  ]);

  const dimensionsMM = parseDimensionsMM(gabarity || dimensions || bodyDimensions);
  const suspension = firstDefined([
    raw.suspension,
    specMap['Подвеска']
  ]) || 'Рессорная';

  const brakesRaw = firstDefined([
    raw.brakes,
    specMap['Тормоз']
  ]);
  const brakes = normalizeBrakes(brakesRaw);

  const trailerImages = copyImages(raw.images || [], productDir, path.join(TRAILER_IMAGES_DIR, trailerId));
  const heroImage = trailerImages[0] || '/images/placeholder/trailer.jpg';

  const optionIds = [];
  if (Array.isArray(raw.options)) {
    raw.options.forEach(opt => {
      const id = ensureAccessory(opt, productDir, accessoryMap);
      if (id) optionIds.push(id);
    });
  }

  return {
    id: trailerId,
    model,
    version,
    name: raw.title || model,
    category,
    segment,
    price: Number(raw.price) || 0,
    currency: 'RUB',
    description: raw.description || '',
    heroImage,
    images: trailerImages,
    capacity,
    capacityUnit: capacity ? 'kg' : undefined,
    dimensions,
    dimensionsMM,
    bodyDimensions,
    gabarity,
    suspension,
    brakes,
    specs: specMap,
    features: raw.features || [],
    compatibility: inferCompatibility(category),
    options: optionIds,
    warehouses: createWarehouseStock(),
    availability: 'in_stock',
    badge: raw.badge,
    isPopular: Boolean(raw.isPopular),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function ensureAccessory(option, productDir, accessoryMap) {
  if (!option || !option.name) return null;
  const key = (option.sku || option.name).toLowerCase();
  if (accessoryMap.has(key)) {
    return accessoryMap.get(key).id;
  }

  const accessoryId = option.sku ? `acc-${option.sku}` : `acc-${slugify(option.name)}`;
  const destDir = path.join(ACCESSORY_IMAGES_DIR, accessoryId);
  const images = copyImages([option.image, option.image_url], productDir, destDir);
  const image = images[0] || '/images/placeholder/accessory.jpg';

  const accessory = {
    id: accessoryId,
    name: option.name,
    price: Number(option.price) || 0,
    currency: 'RUB',
    description: option.description || '',
    category: inferAccessoryCategory(option.name),
    image,
    compatibleWith: ['all'],
    required: false,
    warehouses: createWarehouseStock()
  };

  accessoryMap.set(key, accessory);
  return accessoryId;
}

function copyImages(imagePaths, productDir, targetDir) {
  const result = [];
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) return result;
  ensureDir(targetDir);
  imagePaths.forEach((imgPath, index) => {
    if (!imgPath) return;
    const normalized = imgPath.replace(/\\/g, '/');
    const srcPath = path.isAbsolute(normalized)
      ? normalized
      : path.join(productDir, normalized);
    if (!fs.existsSync(srcPath)) {
      return;
    }
    const fileName = `${index.toString().padStart(2, '0')}-${path.basename(srcPath)}`;
    const destPath = path.join(targetDir, fileName);
    try {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
      const publicPath = `/images/${path.relative(path.join(FRONTEND_PUBLIC, 'images'), destPath).replace(/\\/g, '/')}`;
      result.push(publicPath);
    } catch (err) {
      console.warn(`Не удалось скопировать изображение ${srcPath}: ${err.message}`);
    }
  });
  return result;
}

function pickNumber(values) {
  for (const val of values) {
    const num = parseNumber(val);
    if (typeof num === 'number' && !Number.isNaN(num)) {
      return num;
    }
  }
  return undefined;
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const match = value.replace(/[^0-9,\.]/g, '');
  if (!match) return undefined;
  const normalized = match.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

function parseDimensionsMM(value) {
  if (!value || typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[^0-9x]/g, '');
  const parts = cleaned.split('x').map(part => parseInt(part, 10)).filter(Boolean);
  if (parts.length < 2) return undefined;
  return {
    length: parts[0],
    width: parts[1],
    height: parts[2]
  };
}

function normalizeBrakes(value) {
  if (!value) return 'Нет';
  const str = value.toString().toLowerCase();
  if (str.includes('нет')) return 'Нет';
  return 'Есть';
}

function inferCompatibility(category) {
  switch (category) {
    case 'water':
      return ['boat'];
    case 'moto':
      return ['atv', 'snowmobile', 'motorcycle'];
    default:
      return undefined;
  }
}

function inferAccessoryCategory(name) {
  const lowered = name.toLowerCase();
  if (lowered.includes('лебед')) return 'loading';
  if (lowered.includes('тент')) return 'cover';
  if (lowered.includes('ролик') || lowered.includes('ложемент')) return 'boat_support';
  if (lowered.includes('опор') || lowered.includes('держатель')) return 'support';
  if (lowered.includes('цеп')) return 'safety';
  return 'guides';
}

function createWarehouseStock() {
  return WAREHOUSE_CODES.map(code => ({ warehouse: code, stock: 0 }));
}

function extractVersionFromModel(model) {
  if (!model) return undefined;
  const match = /([0-9]{3,}(?:\.[0-9]{3})?)/.exec(model);
  if (!match) return undefined;
  const value = match[1];
  const parts = value.split('.');
  return parts[1] || undefined;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstDefined(values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function findProductJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findProductJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'product.json') {
      result.push(fullPath);
    }
  }
  return result;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

