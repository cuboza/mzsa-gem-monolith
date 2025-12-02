/**
 * Типы для работы со складскими остатками и доступностью
 */

export interface StockInfo {
  itemId: string;
  itemType: 'trailer' | 'option';
  warehouseId: string;
  warehouseName?: string;
  warehouseCity?: string;
  quantity: number;        // Общее количество на складе
  availableQuantity: number;  // Доступно (не зарезервировано)
  reservedQuantity: number;   // Зарезервировано
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  city: string;
  region: 'ХМАО' | 'ЯНАО';
  type: 'main' | 'regional' | 'partner';
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface MultiWarehouseStock {
  itemId: string;
  itemType: 'trailer' | 'option';
  totalQuantity: number;
  totalAvailable: number;
  totalReserved: number;
  byWarehouse: WarehouseStock[];
}

/**
 * Результат расчёта доступности для клиента
 */
export interface AvailabilityResult {
  isAvailable: boolean;          // Есть ли товар вообще
  isLocalStock: boolean;         // Есть ли на местном складе (в городе клиента)
  localQuantity: number;         // Количество в городе клиента
  otherCitiesQuantity: number;   // Количество в других городах
  deliveryDays: string | null;   // Срок доставки ("1-4 дня", "7-14 дней" или null)
  label: string;                 // Метка для отображения ("В наличии", "1-4 дня" и т.д.)
  badgeClass: string;            // CSS класс для бейджа
  nearestWarehouse?: {           // Ближайший склад с товаром (если не местный)
    city: string;
    quantity: number;
  };
}

/**
 * Настройки отображения остатков
 */
export type StockDisplayMode = 
  | 'by_city'      // Показывать доступность по городу клиента
  | 'total'        // Показывать общий остаток
  | 'hidden';      // Скрыть остатки (только "Под заказ" / "В наличии")

export interface StockSettings {
  displayMode: StockDisplayMode;
  showQuantity: boolean;        // Показывать количество или только статус
  localDeliveryDays: string;    // Срок доставки из другого города (например, "1-4 дня")
  orderDeliveryDays: string;    // Срок доставки под заказ (например, "14-21 день")
}

/**
 * Элементы для резервирования
 */
export interface ReservationItem {
  itemId: string;
  itemType: 'trailer' | 'option';
  quantity: number;
  warehouseId?: string;  // Если не указан, выбирается автоматически
}

/**
 * Результат резервирования
 */
export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  itemsReserved?: ReservationItem[];
  error?: string;
}

/**
 * Конфигурация расстояний между городами (для расчёта сроков)
 */
export interface CityDeliveryConfig {
  cities: {
    [cityName: string]: {
      region: 'ХМАО' | 'ЯНАО';
      deliveryTo: {
        [targetCity: string]: {
          days: string;        // "1-2", "2-4", etc.
          priority: number;    // Приоритет маршрута (меньше = лучше)
        };
      };
    };
  };
}

/**
 * Событие изменения остатков (для логирования/аудита)
 */
export interface StockChangeEvent {
  id: string;
  itemId: string;
  itemType: 'trailer' | 'option';
  warehouseId: string;
  changeType: 'reserve' | 'release' | 'commit' | 'adjust' | 'import';
  quantityBefore: number;
  quantityAfter: number;
  availableBefore: number;
  availableAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  orderId?: string;
  userId?: string;
  reason?: string;
  timestamp: string;
}
