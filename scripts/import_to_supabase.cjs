/**
 * Скрипт импорта данных из db.json в Supabase
 * Запуск: node scripts/import_to_supabase.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
// Используйте service_role key для импорта (установите в переменной окружения SUPABASE_SERVICE_KEY)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Загружаем данные
const dbPath = path.join(__dirname, '..', 'backend', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Категории для прицепов
const CATEGORIES = {
  'general': { name: 'Универсальные', slug: 'general' },
  'water': { name: 'Лодочные', slug: 'water' },
  'commercial': { name: 'Коммерческие', slug: 'commercial' },
  'wrecker': { name: 'Эвакуаторы', slug: 'wrecker' },
  'moto': { name: 'Мото', slug: 'moto' },
};

// Категории для опций
const OPTION_CATEGORIES = {
  'loading': 'Погрузка',
  'support': 'Опорные',
  'spare': 'Запчасти',
  'cover': 'Тенты',
  'safety': 'Безопасность',
  'guides': 'Направляющие',
  'boat_support': 'Лодочные',
};

async function clearTables() {
  console.log('Очищаем таблицы...');
  
  // Порядок важен из-за foreign keys
  await supabase.from('lead_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trailer_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('specifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('features').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Таблицы очищены');
}

async function importCategories() {
  console.log('Импортируем категории...');
  
  const categories = Object.entries(CATEGORIES).map(([key, cat], index) => ({
    name: cat.name,
    slug: cat.slug,
    sort_order: index,
    status: 'active',
    visible_on_site: true,
  }));
  
  const { data, error } = await supabase
    .from('categories')
    .insert(categories)
    .select();
  
  if (error) {
    console.error('Ошибка импорта категорий:', error);
    return {};
  }
  
  // Создаем маппинг slug -> id
  const categoryMap = {};
  data.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });
  
  console.log(`Импортировано ${data.length} категорий`);
  return categoryMap;
}

async function importTrailers(categoryMap) {
  console.log('Импортируем прицепы...');
  
  const trailerMap = {}; // slug -> uuid
  
  for (const trailer of db.trailers) {
    // Основная запись прицепа
    const trailerData = {
      slug: trailer.id,
      model: trailer.model,
      name: trailer.name,
      full_name: `${trailer.model} - ${trailer.name}`,
      description: trailer.description,
      short_description: trailer.name,
      category_id: categoryMap[trailer.category] || null,
      base_price: trailer.price,
      retail_price: trailer.price,
      currency: 'RUB',
      vat_included: true,
      availability: 'in_stock',
      main_image_url: trailer.heroImage || trailer.images?.[0],
      thumbnail_url: trailer.heroImage || trailer.images?.[0],
      status: 'active',
      visible_on_site: true,
      is_published: true,
      sort_order: trailer.price || 0,
    };
    
    const { data, error } = await supabase
      .from('trailers')
      .insert(trailerData)
      .select()
      .single();
    
    if (error) {
      console.error(`Ошибка импорта прицепа ${trailer.id}:`, error.message);
      continue;
    }
    
    trailerMap[trailer.id] = data.id;
    
    // Импортируем изображения
    if (trailer.images && trailer.images.length > 0) {
      const images = trailer.images.map((url, index) => ({
        item_id: data.id,
        item_type: 'trailer',
        url: url,
        type: index === 0 ? 'main' : 'gallery',
        display_order: index,
      }));
      
      await supabase.from('images').insert(images);
    }
    
    // Импортируем характеристики
    if (trailer.specs) {
      const specs = [];
      const specLabels = {
        'polnaya_massa': { label: 'Полная масса', unit: 'кг' },
        'gruzopodemnost': { label: 'Грузоподъёмность', unit: 'кг' },
        'snaryazhyonnaya_massa': { label: 'Снаряжённая масса', unit: 'кг' },
        'gabaritnye_razmery': { label: 'Габаритные размеры', unit: '' },
        'razmery_kuzova': { label: 'Размеры кузова', unit: '' },
        'pogruzochnaya_vysota': { label: 'Погрузочная высота', unit: 'мм' },
        'podveska': { label: 'Подвеска', unit: '' },
        'kol_vo_listov_ressory': { label: 'Количество листов рессоры', unit: '' },
        'nagruzka_na_odnu_os': { label: 'Нагрузка на одну ось', unit: 'кг' },
        'dorozhnyy_prosvet': { label: 'Дорожный просвет', unit: '' },
        'koleya_koles': { label: 'Колея колёс', unit: '' },
        'razmer_kolyos': { label: 'Размер колёс', unit: '' },
        'stsepnoe_ustroystvo': { label: 'Сцепное устройство', unit: '' },
        'tip_tsu': { label: 'Тип ТСУ', unit: '' },
        'fonari': { label: 'Фонари', unit: '' },
        'tormoz': { label: 'Тормоза', unit: '' },
        'shteker': { label: 'Штекер', unit: '' },
        'petli_krepleniya_gruza': { label: 'Петли крепления груза', unit: '' },
        'zashchitnoe_pokrytie': { label: 'Защитное покрытие', unit: '' },
      };
      
      let order = 0;
      for (const [key, value] of Object.entries(trailer.specs)) {
        if (key.endsWith('_unit') || key.endsWith('_length') || key.endsWith('_width') || key.endsWith('_height')) continue;
        
        const specInfo = specLabels[key] || { label: key, unit: '' };
        specs.push({
          trailer_id: data.id,
          key: key,
          label: specInfo.label,
          value_numeric: typeof value === 'number' ? value : null,
          value_text: typeof value === 'string' ? value : String(value),
          unit: trailer.specs[`${key}_unit`] || specInfo.unit,
          display_order: order++,
          is_filterable: true,
          is_comparable: true,
        });
      }
      
      if (specs.length > 0) {
        await supabase.from('specifications').insert(specs);
      }
    }
    
    // Импортируем особенности
    if (trailer.features && trailer.features.length > 0) {
      const features = trailer.features.map((text, index) => ({
        trailer_id: data.id,
        text: text,
        display_order: index,
      }));
      
      await supabase.from('features').insert(features);
    }
  }
  
  console.log(`Импортировано ${Object.keys(trailerMap).length} прицепов`);
  return trailerMap;
}

async function importOptions(trailerMap) {
  console.log('Импортируем опции...');
  
  const optionMap = {}; // old id -> uuid
  
  for (const acc of db.accessories) {
    const optionData = {
      name: acc.name,
      full_name: acc.name,
      article: acc.id,
      description: acc.description || '',
      base_price: acc.price,
      retail_price: acc.price,
      currency: 'RUB',
      vat_included: true,
      option_category: acc.category,
      availability: 'in_stock',
      main_image_url: acc.image,
      status: 'active',
      visible_on_site: true,
    };
    
    const { data, error } = await supabase
      .from('options')
      .insert(optionData)
      .select()
      .single();
    
    if (error) {
      console.error(`Ошибка импорта опции ${acc.id}:`, error.message);
      continue;
    }
    
    optionMap[acc.id] = data.id;
  }
  
  console.log(`Импортировано ${Object.keys(optionMap).length} опций`);
  return optionMap;
}

async function importTrailerOptions(trailerMap, optionMap) {
  console.log('Импортируем связи прицеп-опция...');
  
  let count = 0;
  
  for (const trailer of db.trailers) {
    if (!trailer.options || trailer.options.length === 0) continue;
    
    const trailerId = trailerMap[trailer.id];
    if (!trailerId) continue;
    
    for (const optionId of trailer.options) {
      const optionUuid = optionMap[optionId];
      if (!optionUuid) continue;
      
      const { error } = await supabase
        .from('trailer_options')
        .insert({
          trailer_id: trailerId,
          option_id: optionUuid,
          is_default: false,
          is_required: false,
          sort_order: count,
        });
      
      if (!error) count++;
    }
  }
  
  console.log(`Импортировано ${count} связей прицеп-опция`);
}

async function main() {
  console.log('=== Начинаем импорт данных в Supabase ===\n');
  
  try {
    // Очищаем таблицы
    await clearTables();
    
    // Импортируем данные
    const categoryMap = await importCategories();
    const trailerMap = await importTrailers(categoryMap);
    const optionMap = await importOptions(trailerMap);
    await importTrailerOptions(trailerMap, optionMap);
    
    console.log('\n=== Импорт завершён успешно! ===');
    console.log(`Категорий: ${Object.keys(categoryMap).length}`);
    console.log(`Прицепов: ${Object.keys(trailerMap).length}`);
    console.log(`Опций: ${Object.keys(optionMap).length}`);
    
  } catch (error) {
    console.error('Ошибка импорта:', error);
    process.exit(1);
  }
}

main();
