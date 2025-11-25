#!/usr/bin/env node
/**
 * Анализ аксессуаров: поиск дубликатов и создание единой базы
 * с указанием совместимости для каждого прицепа
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'backend', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const trailers = db.trailers || [];
const accessories = db.accessories || [];

console.log(`\n📊 АНАЛИЗ АКСЕССУАРОВ`);
console.log(`=`.repeat(60));
console.log(`Всего прицепов: ${trailers.length}`);
console.log(`Всего аксессуаров (с дублями): ${accessories.length}`);

// Создаем карту: accessory ID -> список прицепов, где он используется
const accessoryUsage = new Map();

trailers.forEach(trailer => {
  const options = trailer.options || [];
  options.forEach(accId => {
    if (!accessoryUsage.has(accId)) {
      accessoryUsage.set(accId, []);
    }
    accessoryUsage.get(accId).push(trailer.id);
  });
});

// Группируем аксессуары по названию (убираем дубли)
const accessoryByName = new Map();

accessories.forEach(acc => {
  const key = acc.name.toLowerCase().trim();
  if (!accessoryByName.has(key)) {
    accessoryByName.set(key, {
      ...acc,
      compatibleWith: [],
      usageCount: 0
    });
  }
  
  // Добавляем совместимые прицепы
  const usage = accessoryUsage.get(acc.id) || [];
  const existing = accessoryByName.get(key);
  existing.compatibleWith = [...new Set([...existing.compatibleWith, ...usage])];
  existing.usageCount = existing.compatibleWith.length;
});

// Сортируем по количеству использований
const uniqueAccessories = Array.from(accessoryByName.values())
  .sort((a, b) => b.usageCount - a.usageCount);

console.log(`Уникальных аксессуаров (без дублей): ${uniqueAccessories.length}`);
console.log(`Удалено дубликатов: ${accessories.length - uniqueAccessories.length}`);

console.log(`\n📋 ТОП-20 САМЫХ ПОПУЛЯРНЫХ АКСЕССУАРОВ:`);
console.log(`-`.repeat(60));

uniqueAccessories.slice(0, 20).forEach((acc, i) => {
  const compatible = acc.compatibleWith.length;
  const isUniversal = compatible >= trailers.length * 0.8; // 80%+ = универсальный
  const marker = isUniversal ? '🌐' : (compatible > 10 ? '📦' : '🔧');
  console.log(`${i+1}. ${marker} ${acc.name}`);
  console.log(`   Цена: ${acc.price} ₽ | Используется в ${compatible} прицепах`);
});

// Статистика по универсальности
const universal = uniqueAccessories.filter(a => a.usageCount >= trailers.length * 0.5);
const semiUniversal = uniqueAccessories.filter(a => a.usageCount >= 10 && a.usageCount < trailers.length * 0.5);
const specific = uniqueAccessories.filter(a => a.usageCount < 10);

console.log(`\n📈 СТАТИСТИКА УНИВЕРСАЛЬНОСТИ:`);
console.log(`-`.repeat(60));
console.log(`🌐 Универсальные (50%+ прицепов): ${universal.length}`);
console.log(`📦 Полу-универсальные (10+ прицепов): ${semiUniversal.length}`);
console.log(`🔧 Специфичные (<10 прицепов): ${specific.length}`);

// Создаем новую базу без дублей
const newAccessories = uniqueAccessories.map(acc => ({
  id: acc.id,
  name: acc.name,
  price: acc.price,
  currency: acc.currency || 'RUB',
  description: acc.description || '',
  category: acc.category,
  image: acc.image,
  compatibleWith: acc.compatibleWith.length >= trailers.length * 0.8 
    ? ['all'] 
    : acc.compatibleWith,
  required: acc.required || false,
  warehouses: acc.warehouses
}));

// Сохраняем обновленную базу
db.accessories = newAccessories;

// Обновляем ссылки в прицепах (заменяем старые ID на новые)
const nameToId = new Map();
accessories.forEach(acc => {
  const key = acc.name.toLowerCase().trim();
  const newAcc = accessoryByName.get(key);
  if (newAcc) {
    nameToId.set(acc.id, newAcc.id);
  }
});

db.trailers = trailers.map(trailer => ({
  ...trailer,
  options: [...new Set((trailer.options || []).map(oldId => nameToId.get(oldId) || oldId))]
}));

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

console.log(`\n✅ База данных обновлена!`);
console.log(`   - Аксессуаров: ${accessories.length} → ${newAccessories.length}`);
console.log(`   - Дубликаты удалены, совместимость проставлена`);
