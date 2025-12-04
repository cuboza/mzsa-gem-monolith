/**
 * E2E тесты складской логистики
 * Проверяет: склады, остатки, движения, резервирование
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHF2b2NudXZwd25zbnl2bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODEyMzcsImV4cCI6MjA3NTE1NzIzN30.yKf_FMnfGp3I1D5KbxaPzFKZHBNsFONWqNvK_LJjr1w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>) {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, duration: Date.now() - start });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// ========== ТЕСТЫ СКЛАДОВ ==========

async function testGetWarehouses() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('status', 'active');
  
  if (error) throw new Error(`Ошибка загрузки складов: ${error.message}`);
  if (!data || data.length === 0) throw new Error('Нет активных складов');
  
  console.log(`  Найдено ${data.length} активных складов`);
  
  // Проверяем обязательные поля
  for (const w of data) {
    if (!w.id) throw new Error('Склад без id');
    if (!w.name) throw new Error('Склад без имени');
  }
}

async function testWarehouseFields() {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw new Error(`Ошибка: ${error.message}`);
  if (!data) throw new Error('Нет складов для проверки полей');
  
  // Проверяем наличие новых полей
  const fields = ['price_list', 'priority', 'can_ship', 'working_hours', 'sort_order'];
  const presentFields = fields.filter(f => f in data);
  console.log(`  Новые поля (${presentFields.length}/${fields.length}): ${presentFields.join(', ')}`);
}

// ========== ТЕСТЫ ОСТАТКОВ ==========

async function testTrailerStock() {
  const { data, error } = await supabase
    .from('trailer_stock')
    .select('*, trailers(name)')
    .limit(10);
  
  if (error) throw new Error(`Ошибка загрузки остатков: ${error.message}`);
  
  console.log(`  Записей trailer_stock: ${data?.length || 0}`);
  
  // Проверяем структуру
  if (data && data.length > 0) {
    const sample = data[0];
    if (sample.available_quantity === undefined) throw new Error('Нет поля available_quantity');
    if (sample.reserved_quantity === undefined) throw new Error('Нет поля reserved_quantity');
  }
}

async function testOptionStock() {
  const { data, error } = await supabase
    .from('option_stock')
    .select('*, options(name)')
    .limit(10);
  
  if (error) throw new Error(`Ошибка загрузки остатков опций: ${error.message}`);
  
  console.log(`  Записей option_stock: ${data?.length || 0}`);
}

async function testStockSummaryView() {
  const { data, error } = await supabase
    .from('trailer_stock_summary')
    .select('*')
    .limit(5);
  
  if (error) throw new Error(`Ошибка представления trailer_stock_summary: ${error.message}`);
  
  console.log(`  Записей в представлении: ${data?.length || 0}`);
  
  if (data && data.length > 0) {
    const sample = data[0];
    console.log(`  Пример: ${sample.trailer_name}, всего=${sample.total_quantity}, доступно=${sample.total_available}`);
  }
}

// ========== ТЕСТЫ ДВИЖЕНИЙ ==========

async function testStockMovementsTable() {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) throw new Error(`Ошибка таблицы stock_movements: ${error.message}`);
  
  console.log(`  Последних движений: ${data?.length || 0}`);
  
  if (data && data.length > 0) {
    const sample = data[0];
    console.log(`  Пример: ${sample.movement_type}, qty=${sample.quantity}, at=${sample.created_at}`);
  }
}

async function testCreateMovement() {
  // Получаем случайный прицеп и склад
  const { data: trailers } = await supabase
    .from('trailers')
    .select('id, name')
    .eq('status', 'active')
    .limit(1);
  
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, name')
    .eq('status', 'active')
    .limit(1);
  
  if (!trailers?.length || !warehouses?.length) {
    console.log('  ⚠️ Нет данных для тестирования создания движения');
    return;
  }
  
  const trailer = trailers[0];
  const warehouse = warehouses[0];
  
  // Создаём тестовое движение (приход)
  const movement = {
    movement_type: 'adjustment',
    trailer_id: trailer.id,
    to_warehouse_id: warehouse.id,
    quantity: 0, // Тестовое движение с 0 количеством
    previous_quantity: 0,
    new_quantity: 0,
    reason: 'E2E тест складской логистики',
    document_number: `TEST-${Date.now()}`,
    created_by_name: 'E2E Test',
  };
  
  const { data, error } = await supabase
    .from('stock_movements')
    .insert(movement)
    .select()
    .single();
  
  if (error) throw new Error(`Ошибка создания движения: ${error.message}`);
  
  console.log(`  Создано тестовое движение: ${data.id}`);
  
  // Удаляем тестовое движение
  const { error: deleteError } = await supabase
    .from('stock_movements')
    .delete()
    .eq('id', data.id);
  
  if (deleteError) {
    console.log(`  ⚠️ Не удалось удалить тестовое движение: ${deleteError.message}`);
  } else {
    console.log('  Тестовое движение удалено');
  }
}

// ========== ТЕСТЫ RPC ФУНКЦИЙ ==========

async function testUpdateTrailerStockFunction() {
  // Получаем случайный прицеп и склад
  const { data: trailers } = await supabase
    .from('trailers')
    .select('id')
    .eq('status', 'active')
    .limit(1);
  
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id')
    .eq('status', 'active')
    .limit(1);
  
  if (!trailers?.length || !warehouses?.length) {
    console.log('  ⚠️ Нет данных для тестирования RPC');
    return;
  }
  
  const trailerId = trailers[0].id;
  const warehouseId = warehouses[0].id;
  
  // Получаем текущий остаток
  const { data: before } = await supabase
    .from('trailer_stock')
    .select('available_quantity')
    .eq('trailer_id', trailerId)
    .eq('warehouse_id', warehouseId)
    .single();
  
  const qtyBefore = before?.available_quantity || 0;
  console.log(`  Остаток до: ${qtyBefore}`);
  
  // Вызываем функцию +1
  const { error: rpcError1 } = await supabase.rpc('update_trailer_stock_quantity', {
    p_trailer_id: trailerId,
    p_warehouse_id: warehouseId,
    p_delta: 1
  });
  
  if (rpcError1) throw new Error(`Ошибка RPC +1: ${rpcError1.message}`);
  
  // Проверяем
  const { data: after } = await supabase
    .from('trailer_stock')
    .select('available_quantity')
    .eq('trailer_id', trailerId)
    .eq('warehouse_id', warehouseId)
    .single();
  
  const qtyAfter = after?.available_quantity || 0;
  console.log(`  Остаток после +1: ${qtyAfter}`);
  
  if (qtyAfter !== qtyBefore + 1) {
    throw new Error(`Неверный остаток: ожидалось ${qtyBefore + 1}, получено ${qtyAfter}`);
  }
  
  // Откатываем -1
  const { error: rpcError2 } = await supabase.rpc('update_trailer_stock_quantity', {
    p_trailer_id: trailerId,
    p_warehouse_id: warehouseId,
    p_delta: -1
  });
  
  if (rpcError2) throw new Error(`Ошибка RPC -1: ${rpcError2.message}`);
  
  // Финальная проверка
  const { data: final } = await supabase
    .from('trailer_stock')
    .select('available_quantity')
    .eq('trailer_id', trailerId)
    .eq('warehouse_id', warehouseId)
    .single();
  
  const qtyFinal = final?.available_quantity || 0;
  console.log(`  Остаток после отката: ${qtyFinal}`);
  
  if (qtyFinal !== qtyBefore) {
    console.log(`  ⚠️ Остаток не вернулся: ожидалось ${qtyBefore}, получено ${qtyFinal}`);
  }
}

// ========== ТЕСТЫ СВЯЗНОСТИ (ЗАКАЗЫ + ОСТАТКИ) ==========

async function testLeadsTable() {
  const { data, error } = await supabase
    .from('leads')
    .select('id, lead_number, status')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) throw new Error(`Ошибка таблицы leads: ${error.message}`);
  
  console.log(`  Последних заказов: ${data?.length || 0}`);
  
  if (data && data.length > 0) {
    console.log(`  Статусы: ${data.map(l => l.status).join(', ')}`);
  }
}

// ========== ЗАПУСК ТЕСТОВ ==========

async function main() {
  console.log('\n🚀 E2E ТЕСТЫ СКЛАДСКОЙ ЛОГИСТИКИ\n');
  console.log('=' .repeat(50));
  
  // Склады
  console.log('\n📦 СКЛАДЫ');
  await runTest('Загрузка складов', testGetWarehouses);
  await runTest('Новые поля складов', testWarehouseFields);
  
  // Остатки
  console.log('\n📊 ОСТАТКИ');
  await runTest('Остатки прицепов (trailer_stock)', testTrailerStock);
  await runTest('Остатки опций (option_stock)', testOptionStock);
  await runTest('Представление trailer_stock_summary', testStockSummaryView);
  
  // Движения
  console.log('\n🔄 ДВИЖЕНИЯ');
  await runTest('Таблица stock_movements', testStockMovementsTable);
  await runTest('Создание/удаление движения', testCreateMovement);
  
  // RPC функции
  console.log('\n⚡ RPC ФУНКЦИИ');
  await runTest('update_trailer_stock_quantity', testUpdateTrailerStockFunction);
  
  // Связность
  console.log('\n🔗 СВЯЗНОСТЬ (заказы)');
  await runTest('Таблица leads', testLeadsTable);
  
  // Итоги
  console.log('\n' + '=' .repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n📋 ИТОГИ: ${passed} ✅ / ${failed} ❌ (${totalTime}ms)`);
  
  if (failed > 0) {
    console.log('\n❌ ОШИБКИ:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
  
  console.log('\n✅ Все тесты пройдены!\n');
}

main().catch(console.error);
