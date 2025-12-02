/**
 * Хук для расчёта доступности товара с учётом города пользователя
 */
import { useMemo } from 'react';
import { Trailer, Accessory } from '../types';
import { useCitySafe } from '../context/CityContext';
import { 
  calculateAvailability, 
  type MultiWarehouseStock,
  type AvailabilityResult,
  type WarehouseStock,
  DEFAULT_STOCK_SETTINGS,
} from '../features/stock';

/**
 * Конвертирует данные прицепа/опции в MultiWarehouseStock
 */
function toMultiWarehouseStock(
  item: Trailer | Accessory,
  itemType: 'trailer' | 'option'
): MultiWarehouseStock | null {
  // Если есть многоскладская модель
  if ('warehouses' in item && item.warehouses && item.warehouses.length > 0) {
    const warehouses = item.warehouses as WarehouseStock[];
    return {
      itemId: item.id,
      itemType,
      totalQuantity: warehouses.reduce((sum, w) => sum + w.quantity, 0),
      totalAvailable: warehouses.reduce((sum, w) => sum + w.availableQuantity, 0),
      totalReserved: warehouses.reduce((sum, w) => sum + w.reservedQuantity, 0),
      byWarehouse: warehouses,
    };
  }

  // Fallback: если только stock (legacy)
  if ('stock' in item && typeof item.stock === 'number' && item.stock > 0) {
    return {
      itemId: item.id,
      itemType,
      totalQuantity: item.stock,
      totalAvailable: item.stock,
      totalReserved: 0,
      byWarehouse: [{
        warehouseId: 'main',
        warehouseName: 'Главный склад',
        city: 'Сургут',
        region: 'ХМАО',
        type: 'main',
        quantity: item.stock,
        availableQuantity: item.stock,
        reservedQuantity: 0,
      }],
    };
  }

  // Нет данных об остатках
  return null;
}

export interface UseAvailabilityOptions {
  showQuantity?: boolean;
}

/**
 * Хук для расчёта доступности прицепа
 */
export function useTrailerAvailability(
  trailer: Trailer | null,
  options: UseAvailabilityOptions = {}
): AvailabilityResult {
  const { city } = useCitySafe();

  return useMemo(() => {
    if (!trailer) {
      return {
        isAvailable: false,
        isLocalStock: false,
        localQuantity: 0,
        otherCitiesQuantity: 0,
        deliveryDays: null,
        label: 'Нет данных',
        badgeClass: 'bg-gray-200 text-gray-700',
      };
    }

    const stock = toMultiWarehouseStock(trailer, 'trailer');
    const settings = {
      ...DEFAULT_STOCK_SETTINGS,
      showQuantity: options.showQuantity ?? false,
    };

    return calculateAvailability(stock, city, settings);
  }, [trailer, city, options.showQuantity]);
}

/**
 * Хук для расчёта доступности опции
 */
export function useAccessoryAvailability(
  accessory: Accessory | null,
  options: UseAvailabilityOptions = {}
): AvailabilityResult {
  const { city } = useCitySafe();

  return useMemo(() => {
    if (!accessory) {
      return {
        isAvailable: false,
        isLocalStock: false,
        localQuantity: 0,
        otherCitiesQuantity: 0,
        deliveryDays: null,
        label: 'Нет данных',
        badgeClass: 'bg-gray-200 text-gray-700',
      };
    }

    // Парсим stock из строки если нужно
    let stockValue = 0;
    if (typeof accessory.stock === 'string') {
      stockValue = parseInt(accessory.stock) || 0;
    } else if (typeof accessory.stock === 'number') {
      stockValue = accessory.stock;
    }

    const stock: MultiWarehouseStock | null = stockValue > 0 ? {
      itemId: accessory.id,
      itemType: 'option',
      totalQuantity: stockValue,
      totalAvailable: stockValue,
      totalReserved: 0,
      byWarehouse: [{
        warehouseId: 'main',
        warehouseName: 'Главный склад',
        city: 'Сургут',
        region: 'ХМАО',
        type: 'main',
        quantity: stockValue,
        availableQuantity: stockValue,
        reservedQuantity: 0,
      }],
    } : null;

    const settings = {
      ...DEFAULT_STOCK_SETTINGS,
      showQuantity: options.showQuantity ?? false,
    };

    return calculateAvailability(stock, city, settings);
  }, [accessory, city, options.showQuantity]);
}

/**
 * Компонент-обёртка для отображения бейджа доступности
 */
export function getAvailabilityBadgeProps(availability: AvailabilityResult) {
  return {
    variant: availability.isAvailable 
      ? (availability.isLocalStock ? 'success' : 'info')
      : 'neutral' as const,
    label: availability.label,
    showIcon: true,
  };
}
