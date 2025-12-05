/**
 * Генерирует SQL скрипт для добавления связей trailer_options
 * Запускать: node scripts/generate_trailer_options_sql.cjs > sync_trailer_options.sql
 * Затем выполнить в Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHF2b2NudXZwd25zbnl2bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODEyMzcsImV4cCI6MjA3NTE1NzIzN30.yKf_FMnfGp3I1D5KbxaPzFKZHBNsFONWqNvK_LJjr1w';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Получаем все данные
  const { data: trailers } = await supabase.from('trailers').select('id, slug');
  const { data: options } = await supabase.from('options').select('id, article, name');
  const { data: existingLinks } = await supabase.from('trailer_options').select('trailer_id, option_id');

  const trailerMap = new Map(trailers.map(t => [t.slug, t.id]));
  // В Supabase article = 'acc-{sku}', в скрапере sku = '{sku}'
  // Создаём маппинг: sku -> option_id (без префикса acc-)
  const optionMap = new Map();
  for (const o of options) {
    // article = 'acc-8741' -> sku = '8741'
    const sku = o.article?.replace('acc-', '') || '';
    if (sku) optionMap.set(sku, o.id);
  }
  const existingSet = new Set(existingLinks.map(l => `${l.trailer_id}|${l.option_id}`));

  // Структура: output/{category}/{slug}/{slug}.json
  const outputDirs = ['output/lodochniy', 'output/bortovoy', 'output/furgon'];
  const newLinks = [];
  const notFoundOptions = new Set();

  for (const dir of outputDirs) {
    const fullDir = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullDir)) continue;

    // Каждая подпапка = прицеп
    for (const subdir of fs.readdirSync(fullDir)) {
      const subdirPath = path.join(fullDir, subdir);
      if (!fs.statSync(subdirPath).isDirectory()) continue;
      
      const jsonFile = path.join(subdirPath, `${subdir}.json`);
      if (!fs.existsSync(jsonFile)) continue;
      
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      const slug = subdir;
      const trailerId = trailerMap.get(slug);
      
      if (!trailerId || !data.options) continue;

      for (const opt of data.options) {
        const optionId = optionMap.get(opt.sku);
        if (!optionId) {
          notFoundOptions.add(opt.sku + ' - ' + opt.name);
          continue;
        }
        
        const key = `${trailerId}|${optionId}`;
        if (existingSet.has(key)) continue;
        
        newLinks.push({
          trailer_id: trailerId,
          option_id: optionId,
          trailer_slug: slug,
          option_sku: opt.sku
        });
        existingSet.add(key);
      }
    }
  }

  // Генерируем SQL
  if (newLinks.length === 0) {
    console.log('-- Нет новых связей для добавления');
    if (notFoundOptions.size > 0) {
      console.log('-- Опции не найдены в Supabase:');
      for (const nf of notFoundOptions) {
        console.log('--   ' + nf);
      }
    }
    return;
  }

  console.log('-- ============================================');
  console.log('-- SQL скрипт для Supabase SQL Editor');
  console.log(`-- Найдено ${newLinks.length} новых связей trailer_options`);
  if (notFoundOptions.size > 0) {
    console.log(`-- ВНИМАНИЕ: ${notFoundOptions.size} опций не найдены в Supabase`);
  }
  console.log('-- ============================================');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  
  for (const link of newLinks) {
    console.log(`INSERT INTO trailer_options (trailer_id, option_id, is_default, is_required, sort_order)`);
    console.log(`VALUES ('${link.trailer_id}', '${link.option_id}', false, false, 0)`);
    console.log(`ON CONFLICT (trailer_id, option_id) DO NOTHING;`);
    console.log(`-- ${link.trailer_slug} + ${link.option_sku}`);
    console.log('');
  }
  
  console.log('COMMIT;');
  console.log('');
  console.log(`-- Итого: ${newLinks.length} записей`);
}

main().catch(console.error);
