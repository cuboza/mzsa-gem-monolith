/**
 * E2E тесты полного workflow заказа
 * 
 * Эмулирует полный цикл:
 * 1. Клиент выбирает прицеп и опции из каталога
 * 2. Проверяется доступность в городе клиента
 * 3. Создаётся заказ с резервированием
 * 4. Изменение статуса заказа
 * 5. Выполнение или отмена заказа
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAvailability,
  calculateStockAfterReservation,
  calculateStockAfterRelease,
  calculateStockAfterCommit,
  calculateStockAfterTransfer,
  calculateStockAfterReturn,
  canReserve,
  selectWarehouseForReservation,
  prepareReservation,
  validateStockState,
  aggregateStock,
  DEFAULT_STOCK_SETTINGS,
  AVAILABILITY_LABELS,
} from './index';
import type {
  StockInfo,
  WarehouseStock,
  MultiWarehouseStock,
  ReservationItem,
} from './stockTypes';

// ============================================================================
// ТЕСТОВЫЕ ДАННЫЕ: Склады сети
// ============================================================================

const WAREHOUSES = [
  { id: 'wh-surgut', name: 'Склад Сургут', city: 'Сургут', region: 'ХМАО' as const, type: 'main' as const },
  { id: 'wh-nv', name: 'Склад Нижневартовск', city: 'Нижневартовск', region: 'ХМАО' as const, type: 'regional' as const },
  { id: 'wh-noyabrsk', name: 'Склад Ноябрьск', city: 'Ноябрьск', region: 'ЯНАО' as const, type: 'regional' as const },
  { id: 'wh-nu', name: 'Склад Новый Уренгой', city: 'Новый Уренгой', region: 'ЯНАО' as const, type: 'partner' as const },
];

// ============================================================================
// ТЕСТОВЫЕ ДАННЫЕ: Прицепы
// ============================================================================

const TRAILERS = {
  'mzsa-817701': { id: 'mzsa-817701', name: 'МЗСА 817701', category: 'general', price: 95000 },
  'mzsa-817711': { id: 'mzsa-817711', name: 'МЗСА 817711 Лодочный', category: 'water', price: 120000 },
  'mzsa-831134': { id: 'mzsa-831134', name: 'МЗСА 831134 Фургон', category: 'commercial', price: 280000 },
};

// ============================================================================
// ТЕСТОВЫЕ ДАННЫЕ: Опции
// ============================================================================

const OPTIONS = {
  'opt-tент': { id: 'opt-tent', name: 'Тент', price: 8500 },
  'opt-лебедка': { id: 'opt-lebedka', name: 'Лебёдка ручная', price: 12000 },
  'opt-борт': { id: 'opt-bort', name: 'Борт откидной', price: 5500 },
  'opt-колесо': { id: 'opt-koleso', name: 'Запасное колесо', price: 4500 },
};

// ============================================================================
// HELPER: Создание начальных остатков
// ============================================================================

function createInitialStock(): Map<string, StockInfo[]> {
  const stockMap = new Map<string, StockInfo[]>();
  
  // Прицеп 817701: 3 шт в Сургуте, 2 в Нижневартовске
  stockMap.set('mzsa-817701', [
    { itemId: 'mzsa-817701', itemType: 'trailer', warehouseId: 'wh-surgut', quantity: 3, availableQuantity: 3, reservedQuantity: 0 },
    { itemId: 'mzsa-817701', itemType: 'trailer', warehouseId: 'wh-nv', quantity: 2, availableQuantity: 2, reservedQuantity: 0 },
  ]);
  
  // Прицеп 817711 (лодочный): 1 шт только в Ноябрьске
  stockMap.set('mzsa-817711', [
    { itemId: 'mzsa-817711', itemType: 'trailer', warehouseId: 'wh-noyabrsk', quantity: 1, availableQuantity: 1, reservedQuantity: 0 },
  ]);
  
  // Прицеп 831134 (фургон): 0 шт - под заказ
  stockMap.set('mzsa-831134', []);
  
  // Опция: Тент - много везде
  stockMap.set('opt-tent', [
    { itemId: 'opt-tent', itemType: 'option', warehouseId: 'wh-surgut', quantity: 10, availableQuantity: 10, reservedQuantity: 0 },
    { itemId: 'opt-tent', itemType: 'option', warehouseId: 'wh-nv', quantity: 5, availableQuantity: 5, reservedQuantity: 0 },
    { itemId: 'opt-tent', itemType: 'option', warehouseId: 'wh-noyabrsk', quantity: 3, availableQuantity: 3, reservedQuantity: 0 },
  ]);
  
  // Опция: Лебёдка - только в Сургуте
  stockMap.set('opt-lebedka', [
    { itemId: 'opt-lebedka', itemType: 'option', warehouseId: 'wh-surgut', quantity: 2, availableQuantity: 2, reservedQuantity: 0 },
  ]);
  
  // Опция: Борт откидной - в Нижневартовске
  stockMap.set('opt-bort', [
    { itemId: 'opt-bort', itemType: 'option', warehouseId: 'wh-nv', quantity: 4, availableQuantity: 4, reservedQuantity: 0 },
  ]);
  
  // Опция: Запасное колесо - везде
  stockMap.set('opt-koleso', [
    { itemId: 'opt-koleso', itemType: 'option', warehouseId: 'wh-surgut', quantity: 8, availableQuantity: 8, reservedQuantity: 0 },
    { itemId: 'opt-koleso', itemType: 'option', warehouseId: 'wh-nv', quantity: 5, availableQuantity: 5, reservedQuantity: 0 },
    { itemId: 'opt-koleso', itemType: 'option', warehouseId: 'wh-noyabrsk', quantity: 3, availableQuantity: 3, reservedQuantity: 0 },
  ]);
  
  return stockMap;
}

// ============================================================================
// HELPER: Получить агрегированные остатки
// ============================================================================

function getAggregatedStock(stockMap: Map<string, StockInfo[]>, itemId: string): MultiWarehouseStock | null {
  const items = stockMap.get(itemId) || [];
  return aggregateStock(items, WAREHOUSES);
}

// ============================================================================
// HELPER: Обновить остатки после резервирования
// ============================================================================

function applyReservation(
  stockMap: Map<string, StockInfo[]>,
  itemId: string,
  warehouseId: string,
  quantity: number
): void {
  const items = stockMap.get(itemId);
  if (!items) return;
  
  const idx = items.findIndex(s => s.warehouseId === warehouseId);
  if (idx >= 0) {
    items[idx] = calculateStockAfterReservation(items[idx], quantity);
  }
}

// ============================================================================
// HELPER: Обновить остатки после освобождения
// ============================================================================

function applyRelease(
  stockMap: Map<string, StockInfo[]>,
  itemId: string,
  warehouseId: string,
  quantity: number
): void {
  const items = stockMap.get(itemId);
  if (!items) return;
  
  const idx = items.findIndex(s => s.warehouseId === warehouseId);
  if (idx >= 0) {
    items[idx] = calculateStockAfterRelease(items[idx], quantity);
  }
}

// ============================================================================
// HELPER: Обновить остатки после списания
// ============================================================================

function applyCommit(
  stockMap: Map<string, StockInfo[]>,
  itemId: string,
  warehouseId: string,
  quantity: number
): void {
  const items = stockMap.get(itemId);
  if (!items) return;
  
  const idx = items.findIndex(s => s.warehouseId === warehouseId);
  if (idx >= 0) {
    items[idx] = calculateStockAfterCommit(items[idx], quantity);
  }
}

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 1 - Клиент из Сургута, всё в наличии
// ============================================================================

describe('Сценарий 1: Клиент из Сургута заказывает прицеп + опции (всё в наличии)', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Шаг 1: Проверка доступности прицепа 817701 в Сургуте', () => {
    const stock = getAggregatedStock(stockMap, 'mzsa-817701');
    const availability = calculateAvailability(stock, 'Сургут');
    
    expect(availability.isAvailable).toBe(true);
    expect(availability.isLocalStock).toBe(true);
    expect(availability.localQuantity).toBe(3);
    expect(availability.label).toBe(AVAILABILITY_LABELS.inStock);
  });
  
  it('Шаг 2: Проверка доступности опций', () => {
    // Тент - есть в Сургуте
    const tentStock = getAggregatedStock(stockMap, 'opt-tent');
    const tentAvail = calculateAvailability(tentStock, 'Сургут');
    expect(tentAvail.isLocalStock).toBe(true);
    expect(tentAvail.localQuantity).toBe(10);
    
    // Лебёдка - есть в Сургуте
    const lebedkaStock = getAggregatedStock(stockMap, 'opt-lebedka');
    const lebedkaAvail = calculateAvailability(lebedkaStock, 'Сургут');
    expect(lebedkaAvail.isLocalStock).toBe(true);
    expect(lebedkaAvail.localQuantity).toBe(2);
    
    // Запасное колесо - есть в Сургуте
    const kolesoStock = getAggregatedStock(stockMap, 'opt-koleso');
    const kolesoAvail = calculateAvailability(kolesoStock, 'Сургут');
    expect(kolesoAvail.isLocalStock).toBe(true);
  });
  
  it('Шаг 3: Создание заказа - резервирование', () => {
    // Состав заказа: прицеп + тент + лебёдка
    const orderItems: ReservationItem[] = [
      { itemId: 'mzsa-817701', itemType: 'trailer', quantity: 1 },
      { itemId: 'opt-tent', itemType: 'option', quantity: 1 },
      { itemId: 'opt-lebedka', itemType: 'option', quantity: 1 },
    ];
    
    // Проверяем возможность резервирования каждой позиции
    for (const item of orderItems) {
      const stock = getAggregatedStock(stockMap, item.itemId);
      const result = canReserve(stock, item.quantity);
      expect(result.canReserve).toBe(true);
    }
    
    // Подготавливаем резервирование
    const stockByItem = new Map<string, MultiWarehouseStock>();
    for (const item of orderItems) {
      const stock = getAggregatedStock(stockMap, item.itemId);
      if (stock) stockByItem.set(item.itemId, stock);
    }
    
    const { items: preparedItems, errors } = prepareReservation(orderItems, stockByItem, 'Сургут');
    expect(errors).toHaveLength(0);
    expect(preparedItems).toHaveLength(3);
    
    // Все должны резервироваться со склада Сургут
    expect(preparedItems.every(i => i.warehouseId === 'wh-surgut')).toBe(true);
    
    // Применяем резервирование
    for (const item of preparedItems) {
      applyReservation(stockMap, item.itemId, item.warehouseId!, item.quantity);
    }
    
    // Проверяем остатки после резервирования
    const trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    expect(trailerStock?.totalAvailable).toBe(4); // было 5, зарезервировано 1
    expect(trailerStock?.totalReserved).toBe(1);
    
    const tentStock = getAggregatedStock(stockMap, 'opt-tent');
    expect(tentStock?.totalReserved).toBe(1);
    
    const lebedkaStock = getAggregatedStock(stockMap, 'opt-lebedka');
    expect(lebedkaStock?.totalAvailable).toBe(1); // было 2, зарезервировано 1
    expect(lebedkaStock?.totalReserved).toBe(1);
  });
  
  it('Шаг 4: Выполнение заказа - списание остатков', () => {
    // Сначала резервируем
    applyReservation(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    applyReservation(stockMap, 'opt-tent', 'wh-surgut', 1);
    applyReservation(stockMap, 'opt-lebedka', 'wh-surgut', 1);
    
    // Проверяем состояние после резервирования
    let trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    expect(trailerStock?.byWarehouse.find(w => w.city === 'Сургут')?.reservedQuantity).toBe(1);
    
    // Выполняем заказ - списываем
    applyCommit(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    applyCommit(stockMap, 'opt-tent', 'wh-surgut', 1);
    applyCommit(stockMap, 'opt-lebedka', 'wh-surgut', 1);
    
    // Проверяем финальное состояние
    trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    expect(trailerStock?.totalQuantity).toBe(4); // было 5, списано 1
    expect(trailerStock?.totalReserved).toBe(0);
    expect(trailerStock?.totalAvailable).toBe(4);
    
    const lebedkaStock = getAggregatedStock(stockMap, 'opt-lebedka');
    expect(lebedkaStock?.totalQuantity).toBe(1); // было 2, списано 1
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 2 - Клиент из Ноябрьска, доставка из другого города
// ============================================================================

describe('Сценарий 2: Клиент из Ноябрьска, прицеп в другом городе', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Шаг 1: Прицеп 817701 не в Ноябрьске, но есть в Сургуте', () => {
    const stock = getAggregatedStock(stockMap, 'mzsa-817701');
    const availability = calculateAvailability(stock, 'Ноябрьск');
    
    expect(availability.isAvailable).toBe(true);
    expect(availability.isLocalStock).toBe(false);
    expect(availability.localQuantity).toBe(0);
    expect(availability.otherCitiesQuantity).toBe(5);
    expect(availability.deliveryDays).toContain('дня');
    expect(availability.nearestWarehouse?.city).toBeDefined();
  });
  
  it('Шаг 2: Лодочный прицеп 817711 есть в Ноябрьске', () => {
    const stock = getAggregatedStock(stockMap, 'mzsa-817711');
    const availability = calculateAvailability(stock, 'Ноябрьск');
    
    expect(availability.isAvailable).toBe(true);
    expect(availability.isLocalStock).toBe(true);
    expect(availability.localQuantity).toBe(1);
    expect(availability.label).toBe(AVAILABILITY_LABELS.inStock);
  });
  
  it('Шаг 3: Резервирование с разных складов', () => {
    // Клиент в Ноябрьске заказывает:
    // - Лодочный прицеп (есть в Ноябрьске)
    // - Борт откидной (только в Нижневартовске)
    // - Тент (есть в Ноябрьске)
    
    const orderItems: ReservationItem[] = [
      { itemId: 'mzsa-817711', itemType: 'trailer', quantity: 1 },
      { itemId: 'opt-bort', itemType: 'option', quantity: 1 },
      { itemId: 'opt-tent', itemType: 'option', quantity: 1 },
    ];
    
    const stockByItem = new Map<string, MultiWarehouseStock>();
    for (const item of orderItems) {
      const stock = getAggregatedStock(stockMap, item.itemId);
      if (stock) stockByItem.set(item.itemId, stock);
    }
    
    const { items: preparedItems, errors } = prepareReservation(orderItems, stockByItem, 'Ноябрьск');
    
    expect(errors).toHaveLength(0);
    expect(preparedItems).toHaveLength(3);
    
    // Прицеп и тент - из Ноябрьска, борт - из Нижневартовска
    const trailerItem = preparedItems.find(i => i.itemId === 'mzsa-817711');
    expect(trailerItem?.warehouseId).toBe('wh-noyabrsk');
    
    const tentItem = preparedItems.find(i => i.itemId === 'opt-tent');
    expect(tentItem?.warehouseId).toBe('wh-noyabrsk');
    
    const bortItem = preparedItems.find(i => i.itemId === 'opt-bort');
    expect(bortItem?.warehouseId).toBe('wh-nv'); // Нижневартовск
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 3 - Товар под заказ
// ============================================================================

describe('Сценарий 3: Товар под заказ (нет на складах)', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Шаг 1: Фургон 831134 под заказ везде', () => {
    const stock = getAggregatedStock(stockMap, 'mzsa-831134');
    const availability = calculateAvailability(stock, 'Сургут');
    
    expect(availability.isAvailable).toBe(false);
    expect(availability.isLocalStock).toBe(false);
    expect(availability.label).toBe(AVAILABILITY_LABELS.onOrder);
    expect(availability.deliveryDays).toBe(DEFAULT_STOCK_SETTINGS.orderDeliveryDays);
  });
  
  it('Шаг 2: Нельзя зарезервировать товар под заказ', () => {
    const stock = getAggregatedStock(stockMap, 'mzsa-831134');
    const result = canReserve(stock, 1);
    
    expect(result.canReserve).toBe(false);
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 4 - Отмена заказа
// ============================================================================

describe('Сценарий 4: Отмена заказа - возврат остатков', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Полный цикл: создание → резервирование → отмена', () => {
    // Начальные остатки прицепа
    let trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    const initialAvailable = trailerStock?.totalAvailable || 0;
    expect(initialAvailable).toBe(5);
    
    // Шаг 1: Резервируем
    applyReservation(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    
    trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    expect(trailerStock?.totalAvailable).toBe(4);
    expect(trailerStock?.totalReserved).toBe(1);
    
    // Шаг 2: Отменяем заказ - освобождаем резерв
    applyRelease(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    
    trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    expect(trailerStock?.totalAvailable).toBe(5); // Вернулось обратно
    expect(trailerStock?.totalReserved).toBe(0);
    expect(trailerStock?.totalQuantity).toBe(5); // Общее не изменилось
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 5 - Конкурентные заказы
// ============================================================================

describe('Сценарий 5: Два клиента заказывают последний товар', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Первый клиент успевает зарезервировать, второй - нет', () => {
    // Лодочный прицеп - только 1 шт в Ноябрьске
    let stock = getAggregatedStock(stockMap, 'mzsa-817711');
    expect(stock?.totalAvailable).toBe(1);
    
    // Клиент 1 резервирует
    const result1 = canReserve(stock, 1);
    expect(result1.canReserve).toBe(true);
    
    applyReservation(stockMap, 'mzsa-817711', 'wh-noyabrsk', 1);
    
    // Проверяем, что зарезервировано
    stock = getAggregatedStock(stockMap, 'mzsa-817711');
    expect(stock?.totalAvailable).toBe(0);
    expect(stock?.totalReserved).toBe(1);
    
    // Клиент 2 пытается зарезервировать - не может
    const result2 = canReserve(stock, 1);
    expect(result2.canReserve).toBe(false);
    expect(result2.error).toContain('Недостаточно');
    
    // Клиент 2 видит "Под заказ"
    const availability = calculateAvailability(stock, 'Ноябрьск');
    expect(availability.isAvailable).toBe(false);
    expect(availability.label).toBe(AVAILABILITY_LABELS.onOrder);
  });
  
  it('После отмены первого заказа, второй клиент может купить', () => {
    // Резервируем для клиента 1
    applyReservation(stockMap, 'mzsa-817711', 'wh-noyabrsk', 1);
    
    let stock = getAggregatedStock(stockMap, 'mzsa-817711');
    expect(stock?.totalAvailable).toBe(0);
    
    // Клиент 1 отменяет заказ
    applyRelease(stockMap, 'mzsa-817711', 'wh-noyabrsk', 1);
    
    stock = getAggregatedStock(stockMap, 'mzsa-817711');
    expect(stock?.totalAvailable).toBe(1);
    
    // Теперь клиент 2 может зарезервировать
    const result = canReserve(stock, 1);
    expect(result.canReserve).toBe(true);
    
    const availability = calculateAvailability(stock, 'Ноябрьск');
    expect(availability.isAvailable).toBe(true);
    expect(availability.isLocalStock).toBe(true);
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 6 - Заказ с несколькими единицами товара
// ============================================================================

describe('Сценарий 6: Заказ нескольких единиц одного товара', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Заказ 2 одинаковых опций', () => {
    // Запасные колёса: 8 в Сургуте, 5 в НВ, 3 в Ноябрьске = 16 всего
    let stock = getAggregatedStock(stockMap, 'opt-koleso');
    expect(stock?.totalAvailable).toBe(16);
    
    // Заказываем 3 колеса
    const result = canReserve(stock, 3);
    expect(result.canReserve).toBe(true);
    
    // Резервируем все 3 с одного склада (Сургут)
    applyReservation(stockMap, 'opt-koleso', 'wh-surgut', 3);
    
    stock = getAggregatedStock(stockMap, 'opt-koleso');
    expect(stock?.totalAvailable).toBe(13);
    expect(stock?.totalReserved).toBe(3);
    
    // Проверяем конкретный склад
    const surgutStock = stock?.byWarehouse.find(w => w.city === 'Сургут');
    expect(surgutStock?.availableQuantity).toBe(5); // было 8, зарезервировано 3
    expect(surgutStock?.reservedQuantity).toBe(3);
  });
  
  it('Нельзя заказать больше чем есть на одном складе', () => {
    // Лебёдка: только 2 шт в Сургуте
    const stock = getAggregatedStock(stockMap, 'opt-lebedka');
    
    // Пытаемся заказать 3
    const result = canReserve(stock, 3);
    expect(result.canReserve).toBe(false);
    
    // Но можно 2
    const result2 = canReserve(stock, 2);
    expect(result2.canReserve).toBe(true);
  });
});

// ============================================================================
// ТЕСТЫ: ВАЛИДАЦИЯ СОСТОЯНИЯ
// ============================================================================

describe('Валидация состояния остатков на каждом этапе', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Состояние валидно после всех операций', () => {
    // Начальное состояние
    const initialItems = stockMap.get('mzsa-817701') || [];
    for (const item of initialItems) {
      const result = validateStockState(item);
      expect(result.valid).toBe(true);
    }
    
    // После резервирования
    applyReservation(stockMap, 'mzsa-817701', 'wh-surgut', 2);
    const afterReserve = stockMap.get('mzsa-817701') || [];
    for (const item of afterReserve) {
      const result = validateStockState(item);
      expect(result.valid).toBe(true);
    }
    
    // После частичного списания
    applyCommit(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    const afterCommit = stockMap.get('mzsa-817701') || [];
    for (const item of afterCommit) {
      const result = validateStockState(item);
      expect(result.valid).toBe(true);
    }
    
    // После освобождения оставшегося резерва
    applyRelease(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    const afterRelease = stockMap.get('mzsa-817701') || [];
    for (const item of afterRelease) {
      const result = validateStockState(item);
      expect(result.valid).toBe(true);
    }
  });
});

// ============================================================================
// ТЕСТЫ: ИТОГОВАЯ СВОДКА
// ============================================================================

describe('Итоговая проверка workflow', () => {
  it('Полный workflow от выбора до получения', () => {
    const stockMap = createInitialStock();
    
    // === ЭТАП 1: Клиент просматривает каталог ===
    console.log('📋 Этап 1: Просмотр каталога');
    
    const trailerStock = getAggregatedStock(stockMap, 'mzsa-817701');
    const trailerAvail = calculateAvailability(trailerStock, 'Сургут');
    expect(trailerAvail.label).toBe('В наличии');
    console.log(`   Прицеп 817701: ${trailerAvail.label} (${trailerAvail.localQuantity} шт)`);
    
    // === ЭТАП 2: Выбор конфигурации ===
    console.log('🛠️ Этап 2: Выбор конфигурации');
    
    const orderItems = [
      { itemId: 'mzsa-817701', itemType: 'trailer' as const, quantity: 1 },
      { itemId: 'opt-tent', itemType: 'option' as const, quantity: 1 },
      { itemId: 'opt-koleso', itemType: 'option' as const, quantity: 2 },
    ];
    console.log(`   Состав: прицеп + тент + 2 колеса`);
    
    // === ЭТАП 3: Оформление заказа ===
    console.log('📝 Этап 3: Оформление заказа');
    
    const stockByItem = new Map<string, MultiWarehouseStock>();
    for (const item of orderItems) {
      const stock = getAggregatedStock(stockMap, item.itemId);
      if (stock) stockByItem.set(item.itemId, stock);
    }
    
    const { items: prepared, errors } = prepareReservation(orderItems, stockByItem, 'Сургут');
    expect(errors).toHaveLength(0);
    console.log(`   Резервирование: ${prepared.length} позиций`);
    
    // === ЭТАП 4: Резервирование ===
    console.log('🔒 Этап 4: Резервирование остатков');
    
    for (const item of prepared) {
      applyReservation(stockMap, item.itemId, item.warehouseId!, item.quantity);
    }
    
    const afterReserve = getAggregatedStock(stockMap, 'mzsa-817701');
    console.log(`   Прицеп: доступно ${afterReserve?.totalAvailable}, резерв ${afterReserve?.totalReserved}`);
    expect(afterReserve?.totalReserved).toBe(1);
    
    // === ЭТАП 5: Выполнение заказа ===
    console.log('✅ Этап 5: Выполнение заказа');
    
    for (const item of prepared) {
      applyCommit(stockMap, item.itemId, item.warehouseId!, item.quantity);
    }
    
    const afterCommit = getAggregatedStock(stockMap, 'mzsa-817701');
    console.log(`   Прицеп: осталось ${afterCommit?.totalQuantity}, резерв ${afterCommit?.totalReserved}`);
    expect(afterCommit?.totalQuantity).toBe(4); // было 5, списано 1
    expect(afterCommit?.totalReserved).toBe(0);
    
    console.log('🎉 Workflow завершён успешно!');
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 8 - Перемещение между складами
// ============================================================================

describe('Сценарий 8: Перемещение товара между складами', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Успешное перемещение прицепа из Сургута в Ноябрьск', () => {
    // Начальные остатки: Сургут - 3 шт, Ноябрьск - 0 шт (прицепа 817701 нет)
    const initialSurgut = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    expect(initialSurgut?.quantity).toBe(3);
    expect(initialSurgut?.availableQuantity).toBe(3);
    
    // В Ноябрьске нет этого прицепа - создаём запись
    const noyabrskStock: StockInfo = {
      itemId: 'mzsa-817701',
      itemType: 'trailer',
      warehouseId: 'wh-noyabrsk',
      quantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
    };
    
    // Перемещаем 1 прицеп
    const { sourceStock, destinationStock } = calculateStockAfterTransfer(
      initialSurgut!,
      noyabrskStock,
      1
    );
    
    expect(sourceStock.quantity).toBe(2);
    expect(sourceStock.availableQuantity).toBe(2);
    expect(destinationStock.quantity).toBe(1);
    expect(destinationStock.availableQuantity).toBe(1);
  });
  
  it('Перемещение между существующими складами', () => {
    // Прицеп 817701: Сургут - 3, Нижневартовск - 2
    const surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    const nvStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-nv');
    
    expect(surgutStock?.quantity).toBe(3);
    expect(nvStock?.quantity).toBe(2);
    
    // Перемещаем 2 из Сургута в НВ
    const { sourceStock, destinationStock } = calculateStockAfterTransfer(
      surgutStock!,
      nvStock!,
      2
    );
    
    expect(sourceStock.quantity).toBe(1); // 3 - 2
    expect(sourceStock.availableQuantity).toBe(1);
    expect(destinationStock.quantity).toBe(4); // 2 + 2
    expect(destinationStock.availableQuantity).toBe(4);
  });
  
  it('Нельзя переместить больше чем есть на складе', () => {
    const surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    const nvStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-nv');
    
    expect(() => calculateStockAfterTransfer(surgutStock!, nvStock!, 10))
      .toThrow('Недостаточно товара');
  });
  
  it('Нельзя переместить зарезервированный товар', () => {
    // Резервируем 2 из 3
    applyReservation(stockMap, 'mzsa-817701', 'wh-surgut', 2);
    
    const surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    const nvStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-nv');
    
    expect(surgutStock?.availableQuantity).toBe(1);
    expect(surgutStock?.reservedQuantity).toBe(2);
    
    // Можем переместить только 1
    const { sourceStock } = calculateStockAfterTransfer(surgutStock!, nvStock!, 1);
    expect(sourceStock.availableQuantity).toBe(0);
    
    // Но не 2
    expect(() => calculateStockAfterTransfer(surgutStock!, nvStock!, 2))
      .toThrow('Недостаточно товара');
  });
  
  it('Нельзя переместить разные товары', () => {
    const trailerStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    const optionStock = stockMap.get('opt-tent')?.find(s => s.warehouseId === 'wh-surgut');
    
    expect(() => calculateStockAfterTransfer(trailerStock!, optionStock!, 1))
      .toThrow('Перемещение возможно только для одного товара');
  });
});

// ============================================================================
// ТЕСТЫ: СЦЕНАРИЙ 9 - Возврат товара от клиента
// ============================================================================

describe('Сценарий 9: Возврат товара от клиента', () => {
  let stockMap: Map<string, StockInfo[]>;
  
  beforeEach(() => {
    stockMap = createInitialStock();
  });
  
  it('Возврат после выполнения заказа', () => {
    // Начальное: 3 прицепа в Сургуте
    let surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    expect(surgutStock?.quantity).toBe(3);
    
    // Резервируем и списываем (продажа)
    applyReservation(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    applyCommit(stockMap, 'mzsa-817701', 'wh-surgut', 1);
    
    surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    expect(surgutStock?.quantity).toBe(2);
    
    // Возврат
    const returned = calculateStockAfterReturn(surgutStock!, 1);
    expect(returned.quantity).toBe(3);
    expect(returned.availableQuantity).toBe(3);
  });
  
  it('Возврат на другой склад (ближайший к клиенту)', () => {
    // Клиент из Ноябрьска купил прицеп из Сургута
    // При возврате принимаем на склад Ноябрьска
    
    // Создаём запись для Ноябрьска (там нет этого прицепа)
    const noyabrskStock: StockInfo = {
      itemId: 'mzsa-817701',
      itemType: 'trailer',
      warehouseId: 'wh-noyabrsk',
      quantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
    };
    
    const returned = calculateStockAfterReturn(noyabrskStock, 1);
    expect(returned.quantity).toBe(1);
    expect(returned.availableQuantity).toBe(1);
  });
  
  it('Нельзя вернуть отрицательное количество', () => {
    const surgutStock = stockMap.get('mzsa-817701')?.find(s => s.warehouseId === 'wh-surgut');
    
    expect(() => calculateStockAfterReturn(surgutStock!, -1))
      .toThrow('Количество для возврата должно быть положительным');
      
    expect(() => calculateStockAfterReturn(surgutStock!, 0))
      .toThrow('Количество для возврата должно быть положительным');
  });
});
