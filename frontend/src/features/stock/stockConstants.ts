/**
 * Константы для работы со складскими остатками
 */
import type { StockSettings, CityDeliveryConfig } from './stockTypes';

/**
 * Настройки по умолчанию для отображения остатков
 */
export const DEFAULT_STOCK_SETTINGS: StockSettings = {
  displayMode: 'by_city',
  showQuantity: false,
  localDeliveryDays: '1-4 дня',
  orderDeliveryDays: '14-21 день',
};

/**
 * Города сети и сроки доставки между ними
 */
export const CITY_DELIVERY_CONFIG: CityDeliveryConfig = {
  cities: {
    'Сургут': {
      region: 'ХМАО',
      deliveryTo: {
        'Нижневартовск': { days: '1-2', priority: 1 },
        'Ноябрьск': { days: '2-3', priority: 2 },
        'Новый Уренгой': { days: '3-4', priority: 3 },
        'Нефтеюганск': { days: '1-2', priority: 1 },
        'Ханты-Мансийск': { days: '2-3', priority: 2 },
      },
    },
    'Нижневартовск': {
      region: 'ХМАО',
      deliveryTo: {
        'Сургут': { days: '1-2', priority: 1 },
        'Ноябрьск': { days: '2-3', priority: 2 },
        'Новый Уренгой': { days: '3-4', priority: 3 },
        'Нефтеюганск': { days: '2-3', priority: 2 },
        'Ханты-Мансийск': { days: '3-4', priority: 3 },
      },
    },
    'Ноябрьск': {
      region: 'ЯНАО',
      deliveryTo: {
        'Сургут': { days: '2-3', priority: 2 },
        'Нижневартовск': { days: '2-3', priority: 2 },
        'Новый Уренгой': { days: '1-2', priority: 1 },
        'Нефтеюганск': { days: '3-4', priority: 3 },
        'Ханты-Мансийск': { days: '4-5', priority: 4 },
      },
    },
    'Новый Уренгой': {
      region: 'ЯНАО',
      deliveryTo: {
        'Сургут': { days: '3-4', priority: 3 },
        'Нижневартовск': { days: '3-4', priority: 3 },
        'Ноябрьск': { days: '1-2', priority: 1 },
        'Нефтеюганск': { days: '4-5', priority: 4 },
        'Ханты-Мансийск': { days: '5-6', priority: 5 },
      },
    },
    'Нефтеюганск': {
      region: 'ХМАО',
      deliveryTo: {
        'Сургут': { days: '1-2', priority: 1 },
        'Нижневартовск': { days: '2-3', priority: 2 },
        'Ноябрьск': { days: '3-4', priority: 3 },
        'Новый Уренгой': { days: '4-5', priority: 4 },
        'Ханты-Мансийск': { days: '2-3', priority: 2 },
      },
    },
    'Ханты-Мансийск': {
      region: 'ХМАО',
      deliveryTo: {
        'Сургут': { days: '2-3', priority: 2 },
        'Нижневартовск': { days: '3-4', priority: 3 },
        'Ноябрьск': { days: '4-5', priority: 4 },
        'Новый Уренгой': { days: '5-6', priority: 5 },
        'Нефтеюганск': { days: '2-3', priority: 2 },
      },
    },
  },
};

/**
 * CSS классы для бейджей доступности
 */
export const AVAILABILITY_BADGE_CLASSES = {
  inStock: 'bg-green-500 text-white',
  localDelivery: 'bg-blue-500 text-white',
  otherCityDelivery: 'bg-yellow-500 text-gray-900',
  onOrder: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
  outOfStock: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
} as const;

/**
 * Метки доступности
 */
export const AVAILABILITY_LABELS = {
  inStock: 'В наличии',
  onOrder: 'Под заказ',
  outOfStock: 'Нет в наличии',
} as const;

/**
 * Типы изменений остатков
 */
export const STOCK_CHANGE_TYPES = {
  reserve: 'Резервирование',
  release: 'Освобождение',
  commit: 'Списание',
  adjust: 'Корректировка',
  import: 'Импорт из 1С',
} as const;

/**
 * Сроки доставки по умолчанию (внутри региона)
 */
export const DEFAULT_DELIVERY_DAYS = {
  sameCity: '0',           // Самовывоз
  sameRegion: '1-3',       // Внутри региона
  otherRegion: '3-5',      // В другой регион
  onOrder: '14-21',        // Под заказ
} as const;

/**
 * Приоритет складов при резервировании
 * (main - первый, partner - последний)
 */
export const WAREHOUSE_TYPE_PRIORITY = {
  main: 1,
  regional: 2,
  partner: 3,
} as const;
