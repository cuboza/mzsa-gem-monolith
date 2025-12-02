/**
 * Модуль управления складскими остатками
 * 
 * Экспортирует типы, константы и утилиты для работы с остатками и доступностью
 */

// Типы
export type {
  StockInfo,
  WarehouseStock,
  MultiWarehouseStock,
  AvailabilityResult,
  StockDisplayMode,
  StockSettings,
  ReservationItem,
  ReservationResult,
  CityDeliveryConfig,
  StockChangeEvent,
} from './stockTypes';

// Константы
export {
  DEFAULT_STOCK_SETTINGS,
  CITY_DELIVERY_CONFIG,
  AVAILABILITY_BADGE_CLASSES,
  AVAILABILITY_LABELS,
  STOCK_CHANGE_TYPES,
  DEFAULT_DELIVERY_DAYS,
  WAREHOUSE_TYPE_PRIORITY,
} from './stockConstants';

// Утилиты
export {
  // Доступность
  calculateAvailability,
  findNearestWarehouse,
  getDeliveryDays,
  
  // Резервирование
  canReserve,
  selectWarehouseForReservation,
  prepareReservation,
  
  // Расчёт изменений
  calculateStockAfterReservation,
  calculateStockAfterRelease,
  calculateStockAfterCommit,
  
  // Валидация
  validateStockState,
  validateMultiWarehouseStock,
  
  // Вспомогательные
  normalizeCity,
  aggregateStock,
  formatStockDisplay,
} from './stockUtils';
