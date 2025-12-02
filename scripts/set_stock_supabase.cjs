/**
 * Скрипт для установки остатков в Supabase
 * Устанавливает quantity=5, available_quantity=5 для всех прицепов и опций
 * 
 * Требуется SUPABASE_SERVICE_KEY для обхода RLS политик:
 *   $env:SUPABASE_SERVICE_KEY="your_service_role_key"; node set_stock_supabase.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';

// Проверяем наличие service key
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseKey) {
  console.error('❌ Требуется SUPABASE_SERVICE_KEY для обхода RLS политик!');
  console.error('');
  console.error('Установите переменную окружения:');
  console.error('  PowerShell: $env:SUPABASE_SERVICE_KEY="your_key"; node set_stock_supabase.cjs');
  console.error('  Cmd:        set SUPABASE_SERVICE_KEY=your_key && node set_stock_supabase.cjs');
  console.error('');
  console.error('Service role key можно найти в Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function setStockForAllItems() {
  console.log('🚀 Начинаем установку остатков...\n');

  try {
    // 1. Получаем или создаём склад
    console.log('📦 Проверяем склады...');
    let { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    if (whError) {
      console.error('Ошибка получения складов:', whError);
      return;
    }

    let warehouseId;
    if (!warehouses || warehouses.length === 0) {
      console.log('⚠️ Активные склады не найдены, создаём основной склад...');
      const { data: newWarehouse, error: createError } = await supabase
        .from('warehouses')
        .insert({
          name: 'Основной склад Сургут',
          code: 'SURGUT-MAIN',
          warehouse_type: 'retail',
          status: 'active',
          is_main: true,
          address: 'пр-т Мира, 55, Сургут',
        })
        .select()
        .single();

      if (createError) {
        console.error('Ошибка создания склада:', createError);
        return;
      }
      warehouseId = newWarehouse.id;
      console.log(`✅ Создан склад: ${newWarehouse.name} (${warehouseId})`);
    } else {
      warehouseId = warehouses[0].id;
      console.log(`✅ Используем склад: ${warehouses[0].name} (${warehouseId})`);
    }

    // 2. Получаем все прицепы
    console.log('\n🚛 Получаем прицепы...');
    const { data: trailers, error: trError } = await supabase
      .from('trailers')
      .select('id, name, model')
      .eq('status', 'active');

    if (trError) {
      console.error('Ошибка получения прицепов:', trError);
      return;
    }

    console.log(`📋 Найдено прицепов: ${trailers?.length || 0}`);

    // 3. Устанавливаем остатки для прицепов
    console.log('\n📊 Устанавливаем остатки прицепов...');
    let trailerCount = 0;
    for (const trailer of trailers || []) {
      // Проверяем существует ли запись
      const { data: existing } = await supabase
        .from('trailer_stock')
        .select('id')
        .eq('trailer_id', trailer.id)
        .eq('warehouse_id', warehouseId)
        .single();

      if (existing) {
        // Обновляем
        await supabase
          .from('trailer_stock')
          .update({
            quantity: 5,
            available_quantity: 5,
            reserved_quantity: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Создаём новую запись
        await supabase
          .from('trailer_stock')
          .insert({
            trailer_id: trailer.id,
            warehouse_id: warehouseId,
            quantity: 5,
            available_quantity: 5,
            reserved_quantity: 0,
          });
      }
      trailerCount++;
    }
    console.log(`✅ Обновлено остатков прицепов: ${trailerCount}`);

    // 4. Получаем все опции
    console.log('\n🔧 Получаем опции...');
    const { data: options, error: optError } = await supabase
      .from('options')
      .select('id, name')
      .eq('status', 'active');

    if (optError) {
      console.error('Ошибка получения опций:', optError);
      return;
    }

    console.log(`📋 Найдено опций: ${options?.length || 0}`);

    // 5. Устанавливаем остатки для опций
    console.log('\n📊 Устанавливаем остатки опций...');
    let optionCount = 0;
    for (const option of options || []) {
      // Проверяем существует ли запись
      const { data: existing } = await supabase
        .from('option_stock')
        .select('id')
        .eq('option_id', option.id)
        .eq('warehouse_id', warehouseId)
        .single();

      if (existing) {
        // Обновляем
        await supabase
          .from('option_stock')
          .update({
            quantity: 5,
            available_quantity: 5,
            reserved_quantity: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Создаём новую запись
        await supabase
          .from('option_stock')
          .insert({
            option_id: option.id,
            warehouse_id: warehouseId,
            quantity: 5,
            available_quantity: 5,
            reserved_quantity: 0,
          });
      }
      optionCount++;
    }
    console.log(`✅ Обновлено остатков опций: ${optionCount}`);

    // 6. Выводим итоговую статистику
    console.log('\n📈 Итоговая статистика:');
    
    const { data: trailerStockCount } = await supabase
      .from('trailer_stock')
      .select('id', { count: 'exact' });
    
    const { data: optionStockCount } = await supabase
      .from('option_stock')
      .select('id', { count: 'exact' });

    console.log(`   Записей trailer_stock: ${trailerStockCount?.length || 0}`);
    console.log(`   Записей option_stock: ${optionStockCount?.length || 0}`);
    console.log('\n✨ Готово!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запуск
setStockForAllItems();
