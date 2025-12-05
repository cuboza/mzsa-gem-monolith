/**
 * Скрипт для синхронизации связей trailer_options
 * из данных скрапера в Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHF2b2NudXZwd25zbnl2bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODEyMzcsImV4cCI6MjA3NTE1NzIzN30.yKf_FMnfGp3I1D5KbxaPzFKZHBNsFONWqNvK_LJjr1w';

const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function main() {
  console.log('🔄 Синхронизация связей trailer_options...\n');

  // Загрузим все прицепы из Supabase
  const { data: trailers } = await supabase.from('trailers').select('id, slug, model');
  const trailersBySlug = new Map(trailers?.map(t => [t.slug, t]) || []);
  console.log(`📋 Загружено прицепов из Supabase: ${trailers?.length}`);

  // Загрузим все опции из Supabase
  const { data: options } = await supabase.from('options').select('id, name, article');
  const optionsBySku = new Map();
  options?.forEach(o => {
    // article имеет формат "acc-8741", sku в скрапере "8741"
    const sku = o.article?.replace('acc-', '') || '';
    if (sku) {
      optionsBySku.set(sku, o);
    }
  });
  console.log(`📋 Загружено опций из Supabase: ${options?.length}`);

  // Загрузим существующие связи
  const { data: existingLinks } = await supabase.from('trailer_options').select('trailer_id, option_id');
  const existingSet = new Set(existingLinks?.map(l => `${l.trailer_id}|${l.option_id}`) || []);
  console.log(`📋 Существующих связей: ${existingLinks?.length}\n`);

  // Сканируем output директорию
  const categories = ['bortovoy', 'lodochniy', 'furgon'];
  const linksToAdd = [];
  let skipped = 0;
  let notFoundTrailer = 0;
  let notFoundOption = 0;

  for (const category of categories) {
    const categoryDir = path.join(OUTPUT_DIR, category);
    if (!fs.existsSync(categoryDir)) continue;

    const products = fs.readdirSync(categoryDir);
    for (const productDir of products) {
      const jsonPath = path.join(categoryDir, productDir, `${productDir}.json`);
      if (!fs.existsSync(jsonPath)) continue;

      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const slug = data.slug;
      
      const trailer = trailersBySlug.get(slug);
      if (!trailer) {
        // console.log(`⚠️ Прицеп не найден: ${slug}`);
        notFoundTrailer++;
        continue;
      }

      // Обрабатываем опции
      for (const opt of data.options || []) {
        const option = optionsBySku.get(opt.sku);
        if (!option) {
          // console.log(`⚠️ Опция не найдена: ${opt.name} (sku: ${opt.sku})`);
          notFoundOption++;
          continue;
        }

        const key = `${trailer.id}|${option.id}`;
        if (existingSet.has(key)) {
          skipped++;
          continue;
        }

        linksToAdd.push({
          trailer_id: trailer.id,
          option_id: option.id,
          is_default: false,
          is_required: false,
          sort_order: 0,
        });
        existingSet.add(key); // чтобы не дублировать в одном запуске
      }
    }
  }

  console.log(`📊 Статистика:`);
  console.log(`   - Пропущено (уже есть): ${skipped}`);
  console.log(`   - Не найдено прицепов: ${notFoundTrailer}`);
  console.log(`   - Не найдено опций: ${notFoundOption}`);
  console.log(`   - Новых связей: ${linksToAdd.length}\n`);

  if (linksToAdd.length === 0) {
    console.log('✅ Все связи уже синхронизированы!');
    return;
  }

  // Вставляем пачками по 100
  const batchSize = 100;
  for (let i = 0; i < linksToAdd.length; i += batchSize) {
    const batch = linksToAdd.slice(i, i + batchSize);
    const { error } = await supabase.from('trailer_options').insert(batch);
    if (error) {
      console.error(`❌ Ошибка при вставке пачки ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`✅ Вставлено ${batch.length} связей (пачка ${Math.floor(i / batchSize) + 1})`);
    }
  }

  console.log('\n🎉 Синхронизация завершена!');
}

main().catch(console.error);
