/**
 * Тесты для модуля управления складскими остатками
 * 
 * 100% покрытие бизнес-логики:
 * - Расчёт доступности по городам
 * - Резервирование и освобождение
 * - Списание при выполнении заказа
 * - Валидация состояния остатков
 * - Выбор оптимального склада
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAvailability,
  findNearestWarehouse,
  getDeliveryDays,
  canReserve,
  selectWarehouseForReservation,
  prepareReservation,
  calculateStockAfterReservation,
  calculateStockAfterRelease,
  calculateStockAfterCommit,
  calculateStockAfterTransfer,
  calculateStockAfterReturn,
  validateStockState,
  validateMultiWarehouseStock,
  normalizeCity,
  aggregateStock,
  formatStockDisplay,
  DEFAULT_STOCK_SETTINGS,
  AVAILABILITY_LABELS,
  AVAILABILITY_BADGE_CLASSES,
} from './index';
import type {
  StockInfo,
  WarehouseStock,
  MultiWarehouseStock,
  StockSettings,
  ReservationItem,
} from './stockTypes';

// ============================================================================
// ФИКСТУРЫ ДЛЯ ТЕСТОВ
// ============================================================================

const createWarehouseStock = (
  overrides: Partial<WarehouseStock> = {}
): WarehouseStock => ({
  warehouseId: 'wh-1',
  warehouseName: 'Основной склад',
  city: 'Сургут',
  region: 'ХМАО',
  type: 'main',
  quantity: 10,
  availableQuantity: 8,
  reservedQuantity: 2,
  ...overrides,
});

const createMultiWarehouseStock = (
  warehouses: Partial<WarehouseStock>[] = []
): MultiWarehouseStock => {
  const byWarehouse = warehouses.length > 0 
    ? warehouses.map(w => createWarehouseStock(w))
    : [createWarehouseStock()];
  
  return {
    itemId: 'trailer-1',
    itemType: 'trailer',
    totalQuantity: byWarehouse.reduce((sum, w) => sum + w.quantity, 0),
    totalAvailable: byWarehouse.reduce((sum, w) => sum + w.availableQuantity, 0),
    totalReserved: byWarehouse.reduce((sum, w) => sum + w.reservedQuantity, 0),
    byWarehouse,
  };
};

const createStockInfo = (overrides: Partial<StockInfo> = {}): StockInfo => ({
  itemId: 'trailer-1',
  itemType: 'trailer',
  warehouseId: 'wh-1',
  warehouseName: 'Основной склад',
  warehouseCity: 'Сургут',
  quantity: 10,
  availableQuantity: 8,
  reservedQuantity: 2,
  ...overrides,
});

// ============================================================================
// ТЕСТЫ: НОРМАЛИЗАЦИЯ ГОРОДА
// ============================================================================

describe('normalizeCity', () => {
  it('должен убирать лишние пробелы', () => {
    expect(normalizeCity('  Сургут  ')).toBe('Сургут');
    expect(normalizeCity('Новый   Уренгой')).toBe('Новый Уренгой');
  });

  it('должен убирать префикс "г."', () => {
    expect(normalizeCity('г. Сургут')).toBe('Сургут');
    expect(normalizeCity('г.Сургут')).toBe('Сургут');
  });

  it('должен убирать префикс "город"', () => {
    expect(normalizeCity('город Сургут')).toBe('Сургут');
    expect(normalizeCity('Город Нижневартовск')).toBe('Нижневартовск');
  });

  it('должен приводить к правильному регистру', () => {
    expect(normalizeCity('сургут')).toBe('Сургут');
    expect(normalizeCity('НОВЫЙ УРЕНГОЙ')).toBe('Новый Уренгой');
    expect(normalizeCity('нижневартовск')).toBe('Нижневартовск');
  });
});

// ============================================================================
// ТЕСТЫ: РАСЧЁТ ДОСТУПНОСТИ
// ============================================================================

describe('calculateAvailability', () => {
  describe('когда нет остатков', () => {
    it('должен вернуть "Под заказ" для null', () => {
      const result = calculateAvailability(null, 'Сургут');
      
      expect(result.isAvailable).toBe(false);
      expect(result.isLocalStock).toBe(false);
      expect(result.label).toBe(AVAILABILITY_LABELS.onOrder);
      expect(result.badgeClass).toBe(AVAILABILITY_BADGE_CLASSES.onOrder);
    });

    it('должен вернуть "Под заказ" для пустых остатков', () => {
      const stock = createMultiWarehouseStock([
        { quantity: 0, availableQuantity: 0, reservedQuantity: 0 }
      ]);
      
      const result = calculateAvailability(stock, 'Сургут');
      
      expect(result.isAvailable).toBe(false);
      expect(result.deliveryDays).toBe(DEFAULT_STOCK_SETTINGS.orderDeliveryDays);
    });
  });

  describe('когда есть остаток в городе клиента', () => {
    it('должен вернуть "В наличии" для местного склада', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Сургут', availableQuantity: 5 }
      ]);
      
      const result = calculateAvailability(stock, 'Сургут');
      
      expect(result.isAvailable).toBe(true);
      expect(result.isLocalStock).toBe(true);
      expect(result.localQuantity).toBe(5);
      expect(result.deliveryDays).toBeNull();
      expect(result.label).toBe(AVAILABILITY_LABELS.inStock);
      expect(result.badgeClass).toBe(AVAILABILITY_BADGE_CLASSES.inStock);
    });

    it('должен показывать количество, если включена опция', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Сургут', availableQuantity: 5 }
      ]);
      const settings: StockSettings = {
        ...DEFAULT_STOCK_SETTINGS,
        showQuantity: true,
      };
      
      const result = calculateAvailability(stock, 'Сургут', settings);
      
      expect(result.label).toBe('В наличии (5 шт.)');
    });
  });

  describe('когда остаток в другом городе', () => {
    it('должен вернуть срок доставки', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Сургут', availableQuantity: 0 },
        { city: 'Нижневартовск', availableQuantity: 3, warehouseId: 'wh-2' }
      ]);
      
      const result = calculateAvailability(stock, 'Сургут');
      
      expect(result.isAvailable).toBe(true);
      expect(result.isLocalStock).toBe(false);
      expect(result.localQuantity).toBe(0);
      expect(result.otherCitiesQuantity).toBe(3);
      expect(result.deliveryDays).toContain('дня');
      expect(result.nearestWarehouse?.city).toBe('Нижневартовск');
    });

    it('должен выбрать ближайший город', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Сургут', availableQuantity: 0 },
        { city: 'Новый Уренгой', availableQuantity: 5, warehouseId: 'wh-2' },
        { city: 'Нижневартовск', availableQuantity: 2, warehouseId: 'wh-3' }
      ]);
      
      const result = calculateAvailability(stock, 'Сургут');
      
      // Нижневартовск ближе к Сургуту чем Новый Уренгой
      expect(result.nearestWarehouse?.city).toBe('Нижневартовск');
    });
  });

  describe('режимы отображения', () => {
    it('режим total - показывает общий остаток', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Сургут', availableQuantity: 2 },
        { city: 'Нижневартовск', availableQuantity: 3, warehouseId: 'wh-2' }
      ]);
      const settings: StockSettings = {
        ...DEFAULT_STOCK_SETTINGS,
        displayMode: 'total',
        showQuantity: true,
      };
      
      const result = calculateAvailability(stock, 'Ноябрьск', settings);
      
      expect(result.label).toBe('В наличии (5 шт.)');
    });

    it('режим hidden - показывает только статус', () => {
      const stock = createMultiWarehouseStock([
        { city: 'Нижневартовск', availableQuantity: 5 }
      ]);
      const settings: StockSettings = {
        ...DEFAULT_STOCK_SETTINGS,
        displayMode: 'hidden',
      };
      
      const result = calculateAvailability(stock, 'Сургут', settings);
      
      expect(result.isAvailable).toBe(true);
      expect(result.label).toBe(AVAILABILITY_LABELS.inStock);
    });
  });
});

// ============================================================================
// ТЕСТЫ: ПОИСК БЛИЖАЙШЕГО СКЛАДА
// ============================================================================

describe('findNearestWarehouse', () => {
  it('должен вернуть null для пустого списка', () => {
    expect(findNearestWarehouse('Сургут', [])).toBeNull();
  });

  it('должен вернуть единственный склад', () => {
    const warehouses = [createWarehouseStock({ city: 'Нижневартовск' })];
    expect(findNearestWarehouse('Сургут', warehouses)?.city).toBe('Нижневартовск');
  });

  it('должен выбрать склад с наименьшим приоритетом доставки', () => {
    const warehouses = [
      createWarehouseStock({ city: 'Новый Уренгой', warehouseId: 'wh-1' }),
      createWarehouseStock({ city: 'Нижневартовск', warehouseId: 'wh-2' }),
    ];
    
    // Из Сургута до Нижневартовска ближе (1-2 дня) чем до Нового Уренгоя (3-4)
    const result = findNearestWarehouse('Сургут', warehouses);
    expect(result?.city).toBe('Нижневартовск');
  });

  it('должен использовать приоритет типа склада для неизвестного города', () => {
    const warehouses = [
      createWarehouseStock({ city: 'Москва', type: 'partner', warehouseId: 'wh-1' }),
      createWarehouseStock({ city: 'Тюмень', type: 'main', warehouseId: 'wh-2' }),
    ];
    
    const result = findNearestWarehouse('Неизвестный город', warehouses);
    expect(result?.type).toBe('main');
  });
});

// ============================================================================
// ТЕСТЫ: СРОК ДОСТАВКИ
// ============================================================================

describe('getDeliveryDays', () => {
  it('должен вернуть 0 для одного города', () => {
    expect(getDeliveryDays('Сургут', 'Сургут')).toBe('0');
  });

  it('должен вернуть срок из конфига', () => {
    const days = getDeliveryDays('Сургут', 'Нижневартовск');
    expect(days).toContain('1-2');
  });

  it('должен работать в обратном направлении', () => {
    const days = getDeliveryDays('Нижневартовск', 'Сургут');
    expect(days).toContain('1-2');
  });

  it('должен вернуть дефолтный срок для неизвестного маршрута', () => {
    const days = getDeliveryDays('Москва', 'Тюмень');
    expect(days).toBe(DEFAULT_STOCK_SETTINGS.localDeliveryDays);
  });
});

// ============================================================================
// ТЕСТЫ: РЕЗЕРВИРОВАНИЕ
// ============================================================================

describe('canReserve', () => {
  it('должен вернуть false для null', () => {
    const result = canReserve(null, 1);
    expect(result.canReserve).toBe(false);
    expect(result.error).toContain('Нет данных');
  });

  it('должен вернуть false при недостатке остатков', () => {
    const stock = createMultiWarehouseStock([{ availableQuantity: 2 }]);
    const result = canReserve(stock, 5);
    
    expect(result.canReserve).toBe(false);
    expect(result.error).toContain('Недостаточно');
  });

  it('должен вернуть true при достаточных остатках', () => {
    const stock = createMultiWarehouseStock([{ availableQuantity: 10 }]);
    const result = canReserve(stock, 5);
    
    expect(result.canReserve).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('selectWarehouseForReservation', () => {
  it('должен вернуть null если нет подходящего склада', () => {
    const stock = createMultiWarehouseStock([{ availableQuantity: 1 }]);
    expect(selectWarehouseForReservation(stock, 5)).toBeNull();
  });

  it('должен предпочесть склад в городе клиента', () => {
    const stock = createMultiWarehouseStock([
      { city: 'Нижневартовск', availableQuantity: 10, warehouseId: 'wh-1' },
      { city: 'Сургут', availableQuantity: 5, warehouseId: 'wh-2' },
    ]);
    
    const result = selectWarehouseForReservation(stock, 3, 'Сургут');
    expect(result?.city).toBe('Сургут');
  });

  it('должен использовать приоритет типа склада', () => {
    const stock = createMultiWarehouseStock([
      { type: 'partner', availableQuantity: 10, warehouseId: 'wh-1' },
      { type: 'main', availableQuantity: 5, warehouseId: 'wh-2' },
    ]);
    
    const result = selectWarehouseForReservation(stock, 3);
    expect(result?.type).toBe('main');
  });
});

describe('prepareReservation', () => {
  it('должен подготовить резервирование для доступных товаров', () => {
    const items: ReservationItem[] = [
      { itemId: 'trailer-1', itemType: 'trailer', quantity: 1 },
    ];
    const stockMap = new Map<string, MultiWarehouseStock>();
    stockMap.set('trailer-1', createMultiWarehouseStock([
      { city: 'Сургут', availableQuantity: 5, warehouseId: 'wh-1' }
    ]));
    
    const result = prepareReservation(items, stockMap, 'Сургут');
    
    expect(result.errors).toHaveLength(0);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].warehouseId).toBe('wh-1');
  });

  it('должен вернуть ошибку для товара без остатков', () => {
    const items: ReservationItem[] = [
      { itemId: 'trailer-1', itemType: 'trailer', quantity: 1 },
    ];
    const stockMap = new Map<string, MultiWarehouseStock>();
    
    const result = prepareReservation(items, stockMap, 'Сургут');
    
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('нет данных');
  });

  it('должен вернуть ошибку при недостаточных остатках', () => {
    const items: ReservationItem[] = [
      { itemId: 'trailer-1', itemType: 'trailer', quantity: 10 },
    ];
    const stockMap = new Map<string, MultiWarehouseStock>();
    stockMap.set('trailer-1', createMultiWarehouseStock([
      { availableQuantity: 2 }
    ]));
    
    const result = prepareReservation(items, stockMap, 'Сургут');
    
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('недостаточно');
  });
});

// ============================================================================
// ТЕСТЫ: РАСЧЁТ ИЗМЕНЕНИЙ ОСТАТКОВ
// ============================================================================

describe('calculateStockAfterReservation', () => {
  it('должен уменьшить available и увеличить reserved', () => {
    const stock = createStockInfo({
      quantity: 10,
      availableQuantity: 8,
      reservedQuantity: 2,
    });
    
    const result = calculateStockAfterReservation(stock, 3);
    
    expect(result.quantity).toBe(10); // Общее не меняется
    expect(result.availableQuantity).toBe(5); // 8 - 3
    expect(result.reservedQuantity).toBe(5); // 2 + 3
  });

  it('не должен уходить в минус', () => {
    const stock = createStockInfo({ availableQuantity: 2 });
    const result = calculateStockAfterReservation(stock, 5);
    expect(result.availableQuantity).toBe(0);
  });
});

describe('calculateStockAfterRelease', () => {
  it('должен увеличить available и уменьшить reserved', () => {
    const stock = createStockInfo({
      quantity: 10,
      availableQuantity: 5,
      reservedQuantity: 5,
    });
    
    const result = calculateStockAfterRelease(stock, 3);
    
    expect(result.quantity).toBe(10);
    expect(result.availableQuantity).toBe(8); // 5 + 3
    expect(result.reservedQuantity).toBe(2); // 5 - 3
  });

  it('не должен уходить в минус reserved', () => {
    const stock = createStockInfo({ reservedQuantity: 1 });
    const result = calculateStockAfterRelease(stock, 5);
    expect(result.reservedQuantity).toBe(0);
  });
});

describe('calculateStockAfterCommit', () => {
  it('должен уменьшить quantity и reserved', () => {
    const stock = createStockInfo({
      quantity: 10,
      availableQuantity: 5,
      reservedQuantity: 5,
    });
    
    const result = calculateStockAfterCommit(stock, 3);
    
    expect(result.quantity).toBe(7); // 10 - 3
    expect(result.availableQuantity).toBe(5); // Не меняется
    expect(result.reservedQuantity).toBe(2); // 5 - 3
  });

  it('не должен уходить в минус', () => {
    const stock = createStockInfo({ quantity: 1, reservedQuantity: 1 });
    const result = calculateStockAfterCommit(stock, 5);
    expect(result.quantity).toBe(0);
    expect(result.reservedQuantity).toBe(0);
  });
});

// ============================================================================
// ТЕСТЫ: ПОЛНЫЙ ЦИКЛ ЗАКАЗА
// ============================================================================

describe('Полный цикл заказа', () => {
  it('создание → резервирование → выполнение', () => {
    // Начальное состояние
    let stock = createStockInfo({
      quantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });
    
    // Шаг 1: Резервирование при создании заказа
    stock = calculateStockAfterReservation(stock, 1);
    expect(stock.quantity).toBe(5);
    expect(stock.availableQuantity).toBe(4);
    expect(stock.reservedQuantity).toBe(1);
    
    // Шаг 2: Списание при выполнении
    stock = calculateStockAfterCommit(stock, 1);
    expect(stock.quantity).toBe(4);
    expect(stock.availableQuantity).toBe(4);
    expect(stock.reservedQuantity).toBe(0);
  });

  it('создание → резервирование → отмена', () => {
    let stock = createStockInfo({
      quantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });
    
    // Резервирование
    stock = calculateStockAfterReservation(stock, 1);
    expect(stock.availableQuantity).toBe(4);
    expect(stock.reservedQuantity).toBe(1);
    
    // Отмена - освобождение резерва
    stock = calculateStockAfterRelease(stock, 1);
    expect(stock.quantity).toBe(5); // Не списано
    expect(stock.availableQuantity).toBe(5);
    expect(stock.reservedQuantity).toBe(0);
  });

  it('несколько заказов одновременно', () => {
    let stock = createStockInfo({
      quantity: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
    });
    
    // Заказ 1 - резерв 2 шт
    stock = calculateStockAfterReservation(stock, 2);
    expect(stock.availableQuantity).toBe(8);
    expect(stock.reservedQuantity).toBe(2);
    
    // Заказ 2 - резерв 3 шт
    stock = calculateStockAfterReservation(stock, 3);
    expect(stock.availableQuantity).toBe(5);
    expect(stock.reservedQuantity).toBe(5);
    
    // Заказ 1 - выполнен
    stock = calculateStockAfterCommit(stock, 2);
    expect(stock.quantity).toBe(8);
    expect(stock.availableQuantity).toBe(5);
    expect(stock.reservedQuantity).toBe(3);
    
    // Заказ 2 - отменён
    stock = calculateStockAfterRelease(stock, 3);
    expect(stock.quantity).toBe(8);
    expect(stock.availableQuantity).toBe(8);
    expect(stock.reservedQuantity).toBe(0);
  });
});

// ============================================================================
// ТЕСТЫ: ВАЛИДАЦИЯ
// ============================================================================

describe('validateStockState', () => {
  it('должен пройти для корректного состояния', () => {
    const stock = createStockInfo({
      quantity: 10,
      availableQuantity: 8,
      reservedQuantity: 2,
    });
    
    const result = validateStockState(stock);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('должен найти отрицательное количество', () => {
    const stock = createStockInfo({ quantity: -1 });
    const result = validateStockState(stock);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Количество не может быть отрицательным');
  });

  it('должен найти отрицательное доступное', () => {
    const stock = createStockInfo({ availableQuantity: -1 });
    const result = validateStockState(stock);
    expect(result.valid).toBe(false);
  });

  it('должен найти отрицательное зарезервированное', () => {
    const stock = createStockInfo({ reservedQuantity: -1 });
    const result = validateStockState(stock);
    expect(result.valid).toBe(false);
  });

  it('должен найти несоответствие суммы', () => {
    const stock = createStockInfo({
      quantity: 5,
      availableQuantity: 5,
      reservedQuantity: 5, // Сумма = 10 > quantity = 5
    });
    const result = validateStockState(stock);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('превышает');
  });
});

describe('validateMultiWarehouseStock', () => {
  it('должен пройти для корректных данных', () => {
    const stock = createMultiWarehouseStock([
      { quantity: 5, availableQuantity: 3, reservedQuantity: 2 },
      { quantity: 10, availableQuantity: 8, reservedQuantity: 2, warehouseId: 'wh-2' },
    ]);
    
    const result = validateMultiWarehouseStock(stock);
    expect(result.valid).toBe(true);
  });

  it('должен найти несоответствие общего количества', () => {
    const stock: MultiWarehouseStock = {
      itemId: 'trailer-1',
      itemType: 'trailer',
      totalQuantity: 100, // Неправильно!
      totalAvailable: 11,
      totalReserved: 4,
      byWarehouse: [
        createWarehouseStock({ quantity: 5, availableQuantity: 3, reservedQuantity: 2 }),
        createWarehouseStock({ quantity: 10, availableQuantity: 8, reservedQuantity: 2, warehouseId: 'wh-2' }),
      ],
    };
    
    const result = validateMultiWarehouseStock(stock);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Общее количество');
  });
});

// ============================================================================
// ТЕСТЫ: АГРЕГАЦИЯ
// ============================================================================

describe('aggregateStock', () => {
  it('должен вернуть null для пустого массива', () => {
    expect(aggregateStock([], [])).toBeNull();
  });

  it('должен агрегировать остатки из нескольких источников', () => {
    const stockItems: StockInfo[] = [
      createStockInfo({ 
        warehouseId: 'wh-1', 
        quantity: 5, 
        availableQuantity: 3, 
        reservedQuantity: 2 
      }),
      createStockInfo({ 
        warehouseId: 'wh-2', 
        quantity: 10, 
        availableQuantity: 8, 
        reservedQuantity: 2 
      }),
    ];
    const warehouses = [
      { id: 'wh-1', name: 'Склад Сургут', city: 'Сургут', region: 'ХМАО' as const, type: 'main' as const },
      { id: 'wh-2', name: 'Склад Нижневартовск', city: 'Нижневартовск', region: 'ХМАО' as const, type: 'regional' as const },
    ];
    
    const result = aggregateStock(stockItems, warehouses);
    
    expect(result).not.toBeNull();
    expect(result!.totalQuantity).toBe(15);
    expect(result!.totalAvailable).toBe(11);
    expect(result!.totalReserved).toBe(4);
    expect(result!.byWarehouse).toHaveLength(2);
  });
});

// ============================================================================
// ТЕСТЫ: ФОРМАТИРОВАНИЕ
// ============================================================================

describe('formatStockDisplay', () => {
  it('должен вернуть "Под заказ" для null', () => {
    expect(formatStockDisplay(null)).toBe(AVAILABILITY_LABELS.onOrder);
  });

  it('должен вернуть "Под заказ" для нулевых остатков', () => {
    const stock = createMultiWarehouseStock([
      { quantity: 0, availableQuantity: 0, reservedQuantity: 0 }
    ]);
    expect(formatStockDisplay(stock)).toBe(AVAILABILITY_LABELS.onOrder);
  });

  it('должен вернуть "В наличии" для ненулевых остатков', () => {
    const stock = createMultiWarehouseStock([{ availableQuantity: 5 }]);
    expect(formatStockDisplay(stock)).toBe(AVAILABILITY_LABELS.inStock);
  });

  it('должен показать количество если включено', () => {
    const stock = createMultiWarehouseStock([{ availableQuantity: 5 }]);
    const settings: StockSettings = {
      ...DEFAULT_STOCK_SETTINGS,
      showQuantity: true,
    };
    expect(formatStockDisplay(stock, settings)).toBe('5 шт.');
  });
});

// ============================================================================
// ТЕСТЫ: ПЕРЕМЕЩЕНИЕ МЕЖДУ СКЛАДАМИ
// ============================================================================

describe('calculateStockAfterTransfer', () => {
  it('успешное перемещение', () => {
    const source = createStockInfo({
      itemId: 'item-1',
      warehouseId: 'wh-1',
      quantity: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
    });
    
    const destination = createStockInfo({
      itemId: 'item-1',
      warehouseId: 'wh-2',
      quantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });
    
    const { sourceStock, destinationStock } = calculateStockAfterTransfer(source, destination, 3);
    
    expect(sourceStock.quantity).toBe(7);
    expect(sourceStock.availableQuantity).toBe(7);
    expect(destinationStock.quantity).toBe(8);
    expect(destinationStock.availableQuantity).toBe(8);
  });
  
  it('ошибка при недостаточном количестве', () => {
    const source = createStockInfo({
      itemId: 'item-1',
      quantity: 2,
      availableQuantity: 2,
    });
    
    const destination = createStockInfo({ itemId: 'item-1' });
    
    expect(() => calculateStockAfterTransfer(source, destination, 5))
      .toThrow('Недостаточно товара');
  });
  
  it('ошибка при нулевом количестве', () => {
    const source = createStockInfo({ itemId: 'item-1', availableQuantity: 10 });
    const destination = createStockInfo({ itemId: 'item-1' });
    
    expect(() => calculateStockAfterTransfer(source, destination, 0))
      .toThrow('Количество для перемещения должно быть положительным');
  });
  
  it('ошибка при разных товарах', () => {
    const source = createStockInfo({ itemId: 'item-1', availableQuantity: 10 });
    const destination = createStockInfo({ itemId: 'item-2' });
    
    expect(() => calculateStockAfterTransfer(source, destination, 1))
      .toThrow('Перемещение возможно только для одного товара');
  });
});

// ============================================================================
// ТЕСТЫ: ВОЗВРАТ ТОВАРА
// ============================================================================

describe('calculateStockAfterReturn', () => {
  it('успешный возврат', () => {
    const stock = createStockInfo({
      quantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
    });
    
    const returned = calculateStockAfterReturn(stock, 2);
    
    expect(returned.quantity).toBe(7);
    expect(returned.availableQuantity).toBe(7);
    expect(returned.reservedQuantity).toBe(0);
  });
  
  it('возврат на пустой склад', () => {
    const stock = createStockInfo({
      quantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
    });
    
    const returned = calculateStockAfterReturn(stock, 1);
    
    expect(returned.quantity).toBe(1);
    expect(returned.availableQuantity).toBe(1);
  });
  
  it('ошибка при отрицательном количестве', () => {
    const stock = createStockInfo({ quantity: 5 });
    
    expect(() => calculateStockAfterReturn(stock, -1))
      .toThrow('Количество для возврата должно быть положительным');
  });
  
  it('ошибка при нулевом количестве', () => {
    const stock = createStockInfo({ quantity: 5 });
    
    expect(() => calculateStockAfterReturn(stock, 0))
      .toThrow('Количество для возврата должно быть положительным');
  });
});