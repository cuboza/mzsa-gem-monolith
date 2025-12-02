/**
 * Утилиты для работы со складскими остатками
 * 
 * Бизнес-логика расчёта доступности, резервирования и отображения остатков
 */
import type {
  StockInfo,
  WarehouseStock,
  MultiWarehouseStock,
  AvailabilityResult,
  StockSettings,
  ReservationItem,
  ReservationResult,
} from './stockTypes';
import {
  DEFAULT_STOCK_SETTINGS,
  CITY_DELIVERY_CONFIG,
  AVAILABILITY_BADGE_CLASSES,
  AVAILABILITY_LABELS,
  DEFAULT_DELIVERY_DAYS,
  WAREHOUSE_TYPE_PRIORITY,
} from './stockConstants';

// ============================================================================
// ДОСТУПНОСТЬ И ОТОБРАЖЕНИЕ
// ============================================================================

/**
 * Рассчитывает доступность товара для клиента в конкретном городе
 * 
 * @param stock - Информация об остатках по всем складам
 * @param customerCity - Город клиента
 * @param settings - Настройки отображения
 * @returns Результат расчёта доступности
 */
export function calculateAvailability(
  stock: MultiWarehouseStock | null,
  customerCity: string,
  settings: StockSettings = DEFAULT_STOCK_SETTINGS
): AvailabilityResult {
  // Нет данных об остатках
  if (!stock || stock.totalQuantity === 0) {
    return {
      isAvailable: false,
      isLocalStock: false,
      localQuantity: 0,
      otherCitiesQuantity: 0,
      deliveryDays: settings.orderDeliveryDays,
      label: AVAILABILITY_LABELS.onOrder,
      badgeClass: AVAILABILITY_BADGE_CLASSES.onOrder,
    };
  }

  // Нормализуем город клиента
  const normalizedCity = normalizeCity(customerCity);

  // Находим остатки в городе клиента
  const localWarehouse = stock.byWarehouse.find(
    w => normalizeCity(w.city) === normalizedCity
  );
  const localQuantity = localWarehouse?.availableQuantity || 0;

  // Остатки в других городах
  const otherWarehouses = stock.byWarehouse.filter(
    w => normalizeCity(w.city) !== normalizedCity && w.availableQuantity > 0
  );
  const otherCitiesQuantity = otherWarehouses.reduce(
    (sum, w) => sum + w.availableQuantity, 0
  );

  // Режим отображения "общий остаток"
  if (settings.displayMode === 'total') {
    const totalAvailable = localQuantity + otherCitiesQuantity;
    if (totalAvailable > 0) {
      return {
        isAvailable: true,
        isLocalStock: localQuantity > 0,
        localQuantity,
        otherCitiesQuantity,
        deliveryDays: null,
        label: settings.showQuantity 
          ? `${AVAILABILITY_LABELS.inStock} (${totalAvailable} шт.)`
          : AVAILABILITY_LABELS.inStock,
        badgeClass: AVAILABILITY_BADGE_CLASSES.inStock,
      };
    }
  }

  // Режим "скрыть остатки"
  if (settings.displayMode === 'hidden') {
    const isAvailable = localQuantity + otherCitiesQuantity > 0;
    return {
      isAvailable,
      isLocalStock: localQuantity > 0,
      localQuantity,
      otherCitiesQuantity,
      deliveryDays: isAvailable ? null : settings.orderDeliveryDays,
      label: isAvailable ? AVAILABILITY_LABELS.inStock : AVAILABILITY_LABELS.onOrder,
      badgeClass: isAvailable 
        ? AVAILABILITY_BADGE_CLASSES.inStock 
        : AVAILABILITY_BADGE_CLASSES.onOrder,
    };
  }

  // Режим "по городу клиента" (по умолчанию)

  // Есть в городе клиента
  if (localQuantity > 0) {
    return {
      isAvailable: true,
      isLocalStock: true,
      localQuantity,
      otherCitiesQuantity,
      deliveryDays: null,
      label: settings.showQuantity
        ? `${AVAILABILITY_LABELS.inStock} (${localQuantity} шт.)`
        : AVAILABILITY_LABELS.inStock,
      badgeClass: AVAILABILITY_BADGE_CLASSES.inStock,
    };
  }

  // Нет в городе, но есть в других
  if (otherCitiesQuantity > 0) {
    const nearest = findNearestWarehouse(customerCity, otherWarehouses);
    const deliveryDays = getDeliveryDays(customerCity, nearest?.city || '');
    
    return {
      isAvailable: true,
      isLocalStock: false,
      localQuantity: 0,
      otherCitiesQuantity,
      deliveryDays,
      label: deliveryDays,
      badgeClass: AVAILABILITY_BADGE_CLASSES.otherCityDelivery,
      nearestWarehouse: nearest ? {
        city: nearest.city,
        quantity: nearest.availableQuantity,
      } : undefined,
    };
  }

  // Нет нигде
  return {
    isAvailable: false,
    isLocalStock: false,
    localQuantity: 0,
    otherCitiesQuantity: 0,
    deliveryDays: settings.orderDeliveryDays,
    label: AVAILABILITY_LABELS.onOrder,
    badgeClass: AVAILABILITY_BADGE_CLASSES.onOrder,
  };
}

/**
 * Находит ближайший склад с товаром к городу клиента
 */
export function findNearestWarehouse(
  customerCity: string,
  warehouses: WarehouseStock[]
): WarehouseStock | null {
  if (warehouses.length === 0) return null;
  if (warehouses.length === 1) return warehouses[0];

  const normalizedCity = normalizeCity(customerCity);
  const cityConfig = CITY_DELIVERY_CONFIG.cities[normalizedCity];
  
  if (!cityConfig) {
    // Город не в конфиге - сортируем по приоритету типа склада
    return warehouses.sort(
      (a, b) => 
        (WAREHOUSE_TYPE_PRIORITY[a.type] || 99) - 
        (WAREHOUSE_TYPE_PRIORITY[b.type] || 99)
    )[0];
  }

  // Сортируем по приоритету доставки
  const sorted = warehouses
    .map(w => ({
      warehouse: w,
      priority: cityConfig.deliveryTo[w.city]?.priority || 99,
    }))
    .sort((a, b) => a.priority - b.priority);

  return sorted[0]?.warehouse || warehouses[0];
}

/**
 * Получает срок доставки между городами
 */
export function getDeliveryDays(fromCity: string, toCity: string): string {
  const normalizedFrom = normalizeCity(fromCity);
  const normalizedTo = normalizeCity(toCity);

  if (normalizedFrom === normalizedTo) {
    return DEFAULT_DELIVERY_DAYS.sameCity;
  }

  const cityConfig = CITY_DELIVERY_CONFIG.cities[normalizedTo];
  if (cityConfig?.deliveryTo[normalizedFrom]) {
    return `${cityConfig.deliveryTo[normalizedFrom].days} дня`;
  }

  // Проверяем обратное направление
  const fromConfig = CITY_DELIVERY_CONFIG.cities[normalizedFrom];
  if (fromConfig?.deliveryTo[normalizedTo]) {
    return `${fromConfig.deliveryTo[normalizedTo].days} дня`;
  }

  // Определяем по регионам
  const fromRegion = cityConfig?.region || fromConfig?.region;
  const toRegion = CITY_DELIVERY_CONFIG.cities[normalizedTo]?.region;

  if (fromRegion && toRegion) {
    return fromRegion === toRegion 
      ? `${DEFAULT_DELIVERY_DAYS.sameRegion} дня`
      : `${DEFAULT_DELIVERY_DAYS.otherRegion} дней`;
  }

  return DEFAULT_STOCK_SETTINGS.localDeliveryDays;
}

// ============================================================================
// РЕЗЕРВИРОВАНИЕ
// ============================================================================

/**
 * Проверяет возможность резервирования товаров
 */
export function canReserve(
  stock: MultiWarehouseStock | null,
  quantity: number
): { canReserve: boolean; error?: string } {
  if (!stock) {
    return { canReserve: false, error: 'Нет данных об остатках' };
  }

  if (stock.totalAvailable < quantity) {
    return {
      canReserve: false,
      error: `Недостаточно остатков. Доступно: ${stock.totalAvailable}, запрошено: ${quantity}`,
    };
  }

  return { canReserve: true };
}

/**
 * Выбирает оптимальный склад для резервирования
 * Приоритет: город клиента > тип склада > количество
 */
export function selectWarehouseForReservation(
  stock: MultiWarehouseStock,
  quantity: number,
  preferredCity?: string
): WarehouseStock | null {
  // Фильтруем склады с достаточным количеством
  const availableWarehouses = stock.byWarehouse.filter(
    w => w.availableQuantity >= quantity
  );

  if (availableWarehouses.length === 0) return null;
  if (availableWarehouses.length === 1) return availableWarehouses[0];

  // Если указан предпочтительный город
  if (preferredCity) {
    const normalizedCity = normalizeCity(preferredCity);
    const localWarehouse = availableWarehouses.find(
      w => normalizeCity(w.city) === normalizedCity
    );
    if (localWarehouse) return localWarehouse;
  }

  // Сортируем по приоритету типа склада
  return availableWarehouses.sort(
    (a, b) =>
      (WAREHOUSE_TYPE_PRIORITY[a.type] || 99) -
      (WAREHOUSE_TYPE_PRIORITY[b.type] || 99)
  )[0];
}

/**
 * Подготавливает данные для резервирования заказа
 */
export function prepareReservation(
  items: ReservationItem[],
  stockByItem: Map<string, MultiWarehouseStock>,
  customerCity?: string
): { items: ReservationItem[]; errors: string[] } {
  const preparedItems: ReservationItem[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const stock = stockByItem.get(item.itemId);
    
    if (!stock) {
      errors.push(`Товар ${item.itemId}: нет данных об остатках`);
      continue;
    }

    const warehouse = selectWarehouseForReservation(stock, item.quantity, customerCity);
    
    if (!warehouse) {
      errors.push(
        `Товар ${item.itemId}: недостаточно остатков. ` +
        `Запрошено: ${item.quantity}, доступно: ${stock.totalAvailable}`
      );
      continue;
    }

    preparedItems.push({
      ...item,
      warehouseId: warehouse.warehouseId,
    });
  }

  return { items: preparedItems, errors };
}

// ============================================================================
// РАСЧЁТ ИЗМЕНЕНИЙ ОСТАТКОВ
// ============================================================================

/**
 * Рассчитывает остатки после резервирования
 */
export function calculateStockAfterReservation(
  stock: StockInfo,
  quantity: number
): StockInfo {
  return {
    ...stock,
    availableQuantity: Math.max(0, stock.availableQuantity - quantity),
    reservedQuantity: stock.reservedQuantity + quantity,
  };
}

/**
 * Рассчитывает остатки после освобождения резерва
 */
export function calculateStockAfterRelease(
  stock: StockInfo,
  quantity: number
): StockInfo {
  return {
    ...stock,
    availableQuantity: stock.availableQuantity + quantity,
    reservedQuantity: Math.max(0, stock.reservedQuantity - quantity),
  };
}

/**
 * Рассчитывает остатки после списания (выполнение заказа)
 */
export function calculateStockAfterCommit(
  stock: StockInfo,
  quantity: number
): StockInfo {
  return {
    ...stock,
    quantity: Math.max(0, stock.quantity - quantity),
    reservedQuantity: Math.max(0, stock.reservedQuantity - quantity),
  };
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

/**
 * Валидирует состояние остатков
 */
export function validateStockState(stock: StockInfo): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  if (stock.quantity < 0) {
    errors.push('Количество не может быть отрицательным');
  }

  if (stock.availableQuantity < 0) {
    errors.push('Доступное количество не может быть отрицательным');
  }

  if (stock.reservedQuantity < 0) {
    errors.push('Зарезервированное количество не может быть отрицательным');
  }

  if (stock.availableQuantity + stock.reservedQuantity > stock.quantity) {
    errors.push(
      `Сумма доступного (${stock.availableQuantity}) и зарезервированного ` +
      `(${stock.reservedQuantity}) превышает общее количество (${stock.quantity})`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Проверяет консистентность мульти-складских остатков
 */
export function validateMultiWarehouseStock(stock: MultiWarehouseStock): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const calculatedTotal = stock.byWarehouse.reduce((sum, w) => sum + w.quantity, 0);
  if (calculatedTotal !== stock.totalQuantity) {
    errors.push(
      `Общее количество (${stock.totalQuantity}) не соответствует ` +
      `сумме по складам (${calculatedTotal})`
    );
  }

  const calculatedAvailable = stock.byWarehouse.reduce((sum, w) => sum + w.availableQuantity, 0);
  if (calculatedAvailable !== stock.totalAvailable) {
    errors.push(
      `Доступное количество (${stock.totalAvailable}) не соответствует ` +
      `сумме по складам (${calculatedAvailable})`
    );
  }

  const calculatedReserved = stock.byWarehouse.reduce((sum, w) => sum + w.reservedQuantity, 0);
  if (calculatedReserved !== stock.totalReserved) {
    errors.push(
      `Зарезервированное количество (${stock.totalReserved}) не соответствует ` +
      `сумме по складам (${calculatedReserved})`
    );
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Нормализует название города для сравнения
 */
export function normalizeCity(city: string): string {
  let normalized = city
    .trim()
    .replace(/\s+/g, ' ');
  
  // Убираем префиксы
  // Сначала проверяем "город" (с любым регистром)
  if (/^[Гг]ород\s+/u.test(normalized)) {
    normalized = normalized.replace(/^[Гг]ород\s+/u, '');
  } else {
    // Затем "г." или "г"
    normalized = normalized.replace(/^[Гг]\.?\s*/u, '');
  }
  
  // Первая буква заглавная, остальные строчные для каждого слова
  return normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Агрегирует остатки по всем складам в единую структуру
 */
export function aggregateStock(
  stockItems: StockInfo[],
  warehouses: { id: string; name: string; city: string; region: 'ХМАО' | 'ЯНАО'; type: 'main' | 'regional' | 'partner' }[]
): MultiWarehouseStock | null {
  if (stockItems.length === 0) return null;

  const itemId = stockItems[0].itemId;
  const itemType = stockItems[0].itemType;

  const byWarehouse: WarehouseStock[] = stockItems.map(s => {
    const warehouse = warehouses.find(w => w.id === s.warehouseId);
    return {
      warehouseId: s.warehouseId,
      warehouseName: warehouse?.name || s.warehouseName || 'Неизвестный склад',
      city: warehouse?.city || s.warehouseCity || 'Неизвестный город',
      region: warehouse?.region || 'ХМАО',
      type: warehouse?.type || 'main',
      quantity: s.quantity,
      availableQuantity: s.availableQuantity,
      reservedQuantity: s.reservedQuantity,
    };
  });

  return {
    itemId,
    itemType,
    totalQuantity: byWarehouse.reduce((sum, w) => sum + w.quantity, 0),
    totalAvailable: byWarehouse.reduce((sum, w) => sum + w.availableQuantity, 0),
    totalReserved: byWarehouse.reduce((sum, w) => sum + w.reservedQuantity, 0),
    byWarehouse,
  };
}

/**
 * Форматирует остатки для отображения
 */
export function formatStockDisplay(
  stock: MultiWarehouseStock | null,
  settings: StockSettings = DEFAULT_STOCK_SETTINGS
): string {
  if (!stock || stock.totalQuantity === 0) {
    return AVAILABILITY_LABELS.onOrder;
  }

  if (settings.showQuantity) {
    return `${stock.totalAvailable} шт.`;
  }

  return AVAILABILITY_LABELS.inStock;
}
