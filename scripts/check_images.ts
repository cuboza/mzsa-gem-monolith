/**
 * Скрипт для проверки изображений прицепов в Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHF2b2NudXZwd25zbnl2bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODEyMzcsImV4cCI6MjA3NTE1NzIzN30.yKf_FMnfGp3I1D5KbxaPzFKZHBNsFONWqNvK_LJjr1w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkImages() {
  console.log('=== Проверка изображений прицепов в Supabase ===\n');

  // 1. Проверяем main_image_url в таблице trailers
  const { data: trailers, error: trailersError } = await supabase
    .from('trailers')
    .select('id, slug, name, main_image_url, category_id')
    .limit(10);

  if (trailersError) {
    console.error('Ошибка загрузки прицепов:', trailersError);
    return;
  }

  console.log('📦 Прицепы (первые 10):');
  trailers?.forEach((t) => {
    console.log(`  - ${t.slug || t.id}: main_image_url = ${t.main_image_url || '❌ НЕТ'}`);
  });

  // Считаем прицепы без main_image_url
  const { count: noImageCount } = await supabase
    .from('trailers')
    .select('*', { count: 'exact', head: true })
    .is('main_image_url', null);

  const { count: totalCount } = await supabase
    .from('trailers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Статистика main_image_url:`);
  console.log(`  Всего прицепов: ${totalCount}`);
  console.log(`  Без main_image_url: ${noImageCount}`);
  console.log(`  С main_image_url: ${(totalCount || 0) - (noImageCount || 0)}`);

  // 2. Проверяем таблицу images
  const { data: images, count: imagesCount, error: imagesError } = await supabase
    .from('images')
    .select('*', { count: 'exact' })
    .eq('item_type', 'trailer')
    .limit(10);

  if (imagesError) {
    console.error('\nОшибка загрузки images:', imagesError);
  } else {
    console.log(`\n🖼️ Таблица images (item_type='trailer'):`);
    console.log(`  Всего записей: ${imagesCount}`);
    if (images && images.length > 0) {
      console.log('  Примеры:');
      images.forEach((img) => {
        console.log(`    - item_id: ${img.item_id}, url: ${img.url?.substring(0, 50)}...`);
      });
    } else {
      console.log('  ❌ Записей нет!');
    }
  }

  // 3. Проверяем категории
  const { data: categories } = await supabase.from('categories').select('*');
  console.log('\n📂 Категории:');
  categories?.forEach((c) => {
    console.log(`  - ${c.id}: ${c.slug} (${c.name})`);
  });
}

checkImages().catch(console.error);
