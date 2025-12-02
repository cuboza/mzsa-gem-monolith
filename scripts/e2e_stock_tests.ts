/**
 * E2E тесты для проверки работы с остатками при заказах
 * 
 * Тестирует:
 * 1. Резервирование при создании заказа
 * 2. Освобождение при отмене заказа
 * 3. Списание при выполнении заказа
 * 4. Проверку складов куда падают остатки
 * 
 * Запуск: 
 *   $env:SUPABASE_SERVICE_KEY="your_key"; npx ts-node e2e_stock_tests.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY не установлен');
  console.error('Установите: $env:SUPABASE_SERVICE_KEY="your_service_role_key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function log(message: string) {
  console.log(message);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true, message: 'OK' });
    console.log(`✅ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message || String(err) });
    console.log(`❌ ${name}: ${err.message || err}`);
  }
}

// Helper: получить склад
async function getWarehouse() {
  const { data } = await supabase
    .from('warehouses')
    .select('id, name')
    .eq('status', 'active')
    .limit(1)
    .single();
  return data;
}

// Helper: получить прицеп
async function getTrailer() {
  const { data } = await supabase
    .from('trailers')
    .select('id, name, slug')
    .eq('status', 'active')
    .limit(1)
    .single();
  return data;
}

// Helper: получить остатки прицепа
async function getTrailerStock(trailerId: string, warehouseId: string) {
  const { data } = await supabase
    .from('trailer_stock')
    .select('*')
    .eq('trailer_id', trailerId)
    .eq('warehouse_id', warehouseId)
    .single();
  return data;
}

// Helper: установить остатки
async function setTrailerStock(trailerId: string, warehouseId: string, quantity: number, available: number, reserved: number) {
  const { data: existing } = await supabase
    .from('trailer_stock')
    .select('id')
    .eq('trailer_id', trailerId)
    .eq('warehouse_id', warehouseId)
    .single();
  
  if (existing) {
    await supabase
      .from('trailer_stock')
      .update({
        quantity,
        available_quantity: available,
        reserved_quantity: reserved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('trailer_stock')
      .insert({
        trailer_id: trailerId,
        warehouse_id: warehouseId,
        quantity,
        available_quantity: available,
        reserved_quantity: reserved,
      });
  }
}

// Helper: создать тестовый заказ
async function createTestOrder(trailerId: string) {
  const orderNumber = `TEST-${Date.now()}`;
  
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      lead_number: orderNumber,
      customer_name: 'Test Customer',
      customer_phone: '+7 900 000 0000',
      customer_email: 'test@example.com',
      status: 'new',
      type: 'order',
      source: 'e2e_test',
    })
    .select()
    .single();
  
  if (error) throw new Error(`Ошибка создания заказа: ${error.message}`);
  
  // Добавляем позицию
  await supabase
    .from('lead_items')
    .insert({
      lead_id: lead.id,
      item_id: trailerId,
      item_type: 'trailer',
      item_name: 'Test Trailer',
      quantity: 1,
      unit_price: 100000,
    });
  
  return lead;
}

// Helper: резервировать остатки для заказа
async function reserveStockForOrder(orderId: string, trailerId: string, warehouseId: string) {
  const stock = await getTrailerStock(trailerId, warehouseId);
  if (!stock) throw new Error('Остатки не найдены');
  
  if (stock.available_quantity < 1) {
    throw new Error(`Недостаточно остатков. Доступно: ${stock.available_quantity}`);
  }
  
  await supabase
    .from('trailer_stock')
    .update({
      available_quantity: stock.available_quantity - 1,
      reserved_quantity: (stock.reserved_quantity || 0) + 1,
      last_reservation_at: new Date().toISOString(),
    })
    .eq('id', stock.id);
}

// Helper: освободить остатки
async function releaseStockForOrder(orderId: string, trailerId: string, warehouseId: string) {
  const stock = await getTrailerStock(trailerId, warehouseId);
  if (!stock) throw new Error('Остатки не найдены');
  
  await supabase
    .from('trailer_stock')
    .update({
      available_quantity: stock.available_quantity + 1,
      reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - 1),
    })
    .eq('id', stock.id);
}

// Helper: списать остатки
async function commitStockForOrder(trailerId: string, warehouseId: string) {
  const stock = await getTrailerStock(trailerId, warehouseId);
  if (!stock) throw new Error('Остатки не найдены');
  
  await supabase
    .from('trailer_stock')
    .update({
      quantity: Math.max(0, stock.quantity - 1),
      reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - 1),
    })
    .eq('id', stock.id);
}

// Helper: удалить тестовый заказ
async function deleteTestOrder(orderId: string) {
  await supabase.from('lead_items').delete().eq('lead_id', orderId);
  await supabase.from('leads').delete().eq('id', orderId);
}

// ===================== ТЕСТЫ =====================

async function runTests() {
  console.log('\n🧪 Запуск E2E тестов для остатков\n');
  console.log('='.repeat(50));
  
  // Получаем тестовые данные
  const warehouse = await getWarehouse();
  const trailer = await getTrailer();
  
  if (!warehouse) {
    console.error('❌ Не найден активный склад. Сначала выполните миграцию set_stock_5_all_items.sql');
    return;
  }
  
  if (!trailer) {
    console.error('❌ Не найден активный прицеп');
    return;
  }
  
  console.log(`📦 Склад: ${warehouse.name} (${warehouse.id})`);
  console.log(`🚛 Прицеп: ${trailer.name} (${trailer.id})`);
  console.log('='.repeat(50) + '\n');
  
  // ТЕСТ 1: Проверка начальных остатков
  await test('1. Начальные остатки установлены', async () => {
    await setTrailerStock(trailer.id, warehouse.id, 5, 5, 0);
    const stock = await getTrailerStock(trailer.id, warehouse.id);
    if (!stock) throw new Error('Остатки не найдены');
    if (stock.quantity !== 5) throw new Error(`quantity = ${stock.quantity}, ожидалось 5`);
    if (stock.available_quantity !== 5) throw new Error(`available = ${stock.available_quantity}, ожидалось 5`);
    if (stock.reserved_quantity !== 0) throw new Error(`reserved = ${stock.reserved_quantity}, ожидалось 0`);
  });
  
  // ТЕСТ 2: Резервирование при создании заказа
  let testOrder: any;
  await test('2. Резервирование при создании заказа', async () => {
    testOrder = await createTestOrder(trailer.id);
    await reserveStockForOrder(testOrder.id, trailer.id, warehouse.id);
    
    const stock = await getTrailerStock(trailer.id, warehouse.id);
    if (!stock) throw new Error('Остатки не найдены');
    if (stock.quantity !== 5) throw new Error(`quantity = ${stock.quantity}, ожидалось 5`);
    if (stock.available_quantity !== 4) throw new Error(`available = ${stock.available_quantity}, ожидалось 4`);
    if (stock.reserved_quantity !== 1) throw new Error(`reserved = ${stock.reserved_quantity}, ожидалось 1`);
  });
  
  // ТЕСТ 3: Склад остатка после резервирования
  await test('3. Остатки падают на правильный склад', async () => {
    const stock = await getTrailerStock(trailer.id, warehouse.id);
    if (!stock) throw new Error('Остатки не найдены');
    
    // Проверяем что warehouse_id соответствует основному складу
    if (stock.warehouse_id !== warehouse.id) {
      throw new Error(`Склад остатков: ${stock.warehouse_id}, ожидался: ${warehouse.id}`);
    }
    
    log(`   → Склад: ${warehouse.name}`);
  });
  
  // ТЕСТ 4: Отмена заказа - освобождение остатков
  await test('4. Отмена заказа освобождает остатки', async () => {
    // Обновляем статус на cancelled
    await supabase
      .from('leads')
      .update({ status: 'cancelled' })
      .eq('id', testOrder.id);
    
    // Освобождаем остатки
    await releaseStockForOrder(testOrder.id, trailer.id, warehouse.id);
    
    const stock = await getTrailerStock(trailer.id, warehouse.id);
    if (!stock) throw new Error('Остатки не найдены');
    if (stock.available_quantity !== 5) throw new Error(`available = ${stock.available_quantity}, ожидалось 5`);
    if (stock.reserved_quantity !== 0) throw new Error(`reserved = ${stock.reserved_quantity}, ожидалось 0`);
    
    // Удаляем тестовый заказ
    await deleteTestOrder(testOrder.id);
  });
  
  // ТЕСТ 5: Выполнение заказа - списание остатков
  await test('5. Выполнение заказа списывает остатки', async () => {
    // Создаём новый заказ
    testOrder = await createTestOrder(trailer.id);
    await reserveStockForOrder(testOrder.id, trailer.id, warehouse.id);
    
    // Проверяем резерв
    let stock = await getTrailerStock(trailer.id, warehouse.id);
    if (stock?.available_quantity !== 4) throw new Error(`После резерва: available = ${stock?.available_quantity}`);
    
    // Обновляем статус на completed
    await supabase
      .from('leads')
      .update({ status: 'completed' })
      .eq('id', testOrder.id);
    
    // Списываем остатки
    await commitStockForOrder(trailer.id, warehouse.id);
    
    stock = await getTrailerStock(trailer.id, warehouse.id);
    if (!stock) throw new Error('Остатки не найдены');
    if (stock.quantity !== 4) throw new Error(`quantity = ${stock.quantity}, ожидалось 4`);
    if (stock.available_quantity !== 4) throw new Error(`available = ${stock.available_quantity}, ожидалось 4`);
    if (stock.reserved_quantity !== 0) throw new Error(`reserved = ${stock.reserved_quantity}, ожидалось 0`);
    
    // Удаляем тестовый заказ
    await deleteTestOrder(testOrder.id);
  });
  
  // ТЕСТ 6: Изменение заказа - перерезервирование
  await test('6. Удаление заказа освобождает остатки', async () => {
    // Восстанавливаем начальные остатки
    await setTrailerStock(trailer.id, warehouse.id, 5, 5, 0);
    
    // Создаём заказ
    testOrder = await createTestOrder(trailer.id);
    await reserveStockForOrder(testOrder.id, trailer.id, warehouse.id);
    
    // Проверяем резерв
    let stock = await getTrailerStock(trailer.id, warehouse.id);
    if (stock?.reserved_quantity !== 1) throw new Error(`reserved = ${stock?.reserved_quantity}, ожидалось 1`);
    
    // Освобождаем перед удалением
    await releaseStockForOrder(testOrder.id, trailer.id, warehouse.id);
    
    // Удаляем заказ
    await deleteTestOrder(testOrder.id);
    
    stock = await getTrailerStock(trailer.id, warehouse.id);
    if (stock?.available_quantity !== 5) throw new Error(`available = ${stock?.available_quantity}, ожидалось 5`);
    if (stock?.reserved_quantity !== 0) throw new Error(`reserved = ${stock?.reserved_quantity}, ожидалось 0`);
  });
  
  // ТЕСТ 7: Проверка на недостаточные остатки
  await test('7. Нельзя зарезервировать больше чем есть', async () => {
    // Устанавливаем 0 остатков
    await setTrailerStock(trailer.id, warehouse.id, 0, 0, 0);
    
    testOrder = await createTestOrder(trailer.id);
    
    let errorOccurred = false;
    try {
      await reserveStockForOrder(testOrder.id, trailer.id, warehouse.id);
    } catch (err: any) {
      errorOccurred = err.message.includes('Недостаточно');
    }
    
    await deleteTestOrder(testOrder.id);
    
    if (!errorOccurred) throw new Error('Ожидалась ошибка о недостаточных остатках');
    
    // Восстанавливаем
    await setTrailerStock(trailer.id, warehouse.id, 5, 5, 0);
  });
  
  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 РЕЗУЛЬТАТЫ ТЕСТОВ:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
    if (!r.passed) {
      console.log(`   └─ ${r.message}`);
    }
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Всего: ${results.length} | Пройдено: ${passed} | Не пройдено: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 Все тесты пройдены успешно!\n');
  } else {
    console.log('\n⚠️ Есть непройденные тесты.\n');
    process.exit(1);
  }
}

// Запуск
runTests().catch(console.error);
