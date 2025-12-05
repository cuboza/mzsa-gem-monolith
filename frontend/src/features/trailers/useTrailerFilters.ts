/**
 * Хук для фильтрации и сортировки прицепов
 * Централизованная логика, которая раньше дублировалась в Catalog и Configurator
 */

import { useMemo } from 'react';
import { Trailer } from '../../types';
import { parseSearchQuery, mapVehicleCategoryToTrailerCategory } from '../../utils/searchParser';
import {
  getAxlesCount,
  getFullWeight,
  getMaxVehicleLength,
  getVehicleVolume,
  parseDimensions,
  parseBoatLength,
} from './trailerUtils';
import {
  SMART_SEARCH_SIZE_THRESHOLD_MM,
  DEFAULT_MAX_PRICE,
} from './trailerConstants';

// ============================================================================
// ТИПЫ
// ============================================================================

export interface TrailerFilters {
  searchQuery?: string;
  category?: string;
  onlyInStock?: boolean;
  minPrice?: string | number;
  maxPrice?: string | number;
  axles?: string;
  brakes?: string;
  sortOption?: string;
  vehicleCategory?: string;
  vehicleLength?: number;
  vehicleWidth?: number;
  vehicleWeight?: number;
  /** Когда true, техника выбрана из автодополнения — поиск только по совместимости */
  vehicleSelected?: boolean;
}

export interface UseTrailerFiltersResult {
  filteredTrailers: Trailer[];
  totalCount: number;
}

// ============================================================================
// ХУК
// ============================================================================

export const useTrailerFilters = (
  trailers: Trailer[],
  filters: TrailerFilters
): UseTrailerFiltersResult => {
  const filteredTrailers = useMemo(() => {
    const {
      searchQuery,
      category,
      onlyInStock,
      minPrice,
      maxPrice,
      axles,
      brakes,
      sortOption = 'price_asc',
      vehicleCategory,
      vehicleLength,
      vehicleWidth,
      vehicleWeight,
      vehicleSelected,
    } = filters;

    // Парсим поисковый запрос для умного поиска
    const parsed = searchQuery ? parseSearchQuery(searchQuery) : null;

    let result = trailers.filter((trailer) => {
      // ВАЖНО: Фильтрация по isVisible выполняется на уровне провайдера данных
      // (getTrailers возвращает только видимые, getAllTrailers - все для админки)
      // Здесь фильтр НЕ нужен - прицепы уже отфильтрованы

      // =========================================
      // 1. Фильтрация по категории прицепа (из UI фильтра)
      // =========================================
      if (category && category !== 'all' && trailer.category !== category) {
        return false;
      }

      // =========================================
      // 2. Умный поиск по категории техники (из текстового запроса)
      // Например: "лодка 4м" → показать лодочные прицепы
      // =========================================
      if (parsed?.category) {
        const requiredTrailerCategory = mapVehicleCategoryToTrailerCategory(parsed.category);
        if (requiredTrailerCategory && trailer.category !== requiredTrailerCategory) {
          return false;
        }
      }

      // =========================================
      // 3. Совместимость техники и прицепа
      // - Лодочные прицепы (water) подходят ТОЛЬКО для лодок/катеров/гидроциклов
      // - Универсальные (general) и коммерческие (commercial) — для остальной техники
      // =========================================
      if (vehicleCategory) {
        const isWaterVehicle = vehicleCategory === 'boat';
        const isWaterTrailer = trailer.category === 'water';
        
        // Лодочные прицепы — только для водной техники
        if (isWaterTrailer && !isWaterVehicle) {
          return false;
        }
        // Водная техника — только на лодочные прицепы
        if (isWaterVehicle && !isWaterTrailer) {
          return false;
        }
      }

      // =========================================
      // 4. Фильтрация по РАЗМЕРАМ техники (главный фильтр!)
      // Когда выбрана техника — показываем ВСЕ прицепы, куда она помещается
      // =========================================
      
      // Умный поиск по размерам из текста (например "лодка 4м")
      if (parsed?.length) {
        const trailerMaxLength = getMaxVehicleLength(trailer);
        const maxAllowed = parsed.length + SMART_SEARCH_SIZE_THRESHOLD_MM;
        if (trailerMaxLength < parsed.length || trailerMaxLength > maxAllowed) {
          return false;
        }
      }

      // Точный размер техники из автодополнения/конфигуратора
      if (vehicleLength && vehicleLength > 0) {
        const trailerMaxLength = getMaxVehicleLength(trailer);
        // Если у прицепа указана макс. длина и техника не влезает — отсеиваем
        if (trailerMaxLength > 0 && vehicleLength > trailerMaxLength) {
          return false;
        }
      }

      if (vehicleWidth && vehicleWidth > 0) {
        // Если у прицепа указана макс. ширина и техника не влезает — отсеиваем
        if (trailer.maxVehicleWidth && vehicleWidth > trailer.maxVehicleWidth) {
          return false;
        }
      }

      // Весовое ограничение НЕ учитываем при выборе техники —
      // только размерное (длина, ширина). Вес проверяется только для умного поиска.

      // =========================================
      // 5. Умный поиск по объёму
      // =========================================
      if (parsed?.volume) {
        const trailerVolume = getVehicleVolume(trailer);
        if (trailerVolume < parsed.volume) {
          return false;
        }
      }

      // =========================================
      // 5. Умный поиск по весу
      // =========================================
      if (parsed?.weight) {
        const trailerCapacity = trailer.capacity ||
          parseInt(String(trailer.specs?.gruzopodemnost || '').replace(/\D/g, '')) || 0;
        if (trailerCapacity < parsed.weight) {
          return false;
        }
      }

      // =========================================
      // 6. Текстовый поиск
      // =========================================
      // Если выбрана конкретная техника из автодополнения — НЕ ищем по названию прицепа,
      // т.к. фильтрация уже применена через vehicleCategory/Length/Width/Weight
      if (!vehicleSelected && parsed?.cleanQuery && parsed.cleanQuery.trim()) {
        const searchLower = parsed.cleanQuery.toLowerCase();
        const nameMatch = trailer.name?.toLowerCase().includes(searchLower);
        const modelMatch = trailer.model?.toLowerCase().includes(searchLower);
        const descMatch = trailer.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !modelMatch && !descMatch) {
          return false;
        }
      }

      // =========================================
      // 7. Фильтр по наличию
      // =========================================
      if (onlyInStock && trailer.availability !== 'in_stock') {
        return false;
      }

      // =========================================
      // 8. Фильтр по цене
      // =========================================
      const min = minPrice ? parseInt(String(minPrice)) : 0;
      const max = maxPrice ? parseInt(String(maxPrice)) : DEFAULT_MAX_PRICE;
      if (trailer.price < min || trailer.price > max) {
        return false;
      }

      // =========================================
      // 9. Фильтр по осям
      // =========================================
      if (axles && axles !== 'all') {
        const trailerAxles = getAxlesCount(trailer);
        if (trailerAxles !== parseInt(axles)) {
          return false;
        }
      }

      // =========================================
      // 10. Фильтр по тормозам
      // =========================================
      if (brakes && brakes !== 'all') {
        const weight = getFullWeight(trailer);
        // Тормоза требуются при полной массе > 750 кг
        const hasBrakesRequired = weight > 750;
        if (brakes === 'yes' && !hasBrakesRequired) {
          return false;
        }
        if (brakes === 'no' && hasBrakesRequired) {
          return false;
        }
      }

      return true;
    });

    // =========================================
    // СОРТИРОВКА
    // =========================================
    
    // Специальная сортировка при выборе техники из автокомплита:
    // 1. Сначала в наличии (in_stock, days_1_3) — по возрастанию размеров
    // 2. Потом под заказ (days_7_14 и др.) — по возрастанию размеров
    if (vehicleSelected) {
      result.sort((a, b) => {
        // Определяем "в наличии" как in_stock или days_1_3 (быстрая доставка)
        const isAvailableA = a.availability === 'in_stock' || a.availability === 'days_1_3';
        const isAvailableB = b.availability === 'in_stock' || b.availability === 'days_1_3';
        
        // Сначала сортируем по наличию
        if (isAvailableA && !isAvailableB) return -1;
        if (!isAvailableA && isAvailableB) return 1;
        
        // Внутри группы — по возрастанию максимальной длины техники (размеру прицепа)
        const lengthA = getMaxVehicleLength(a);
        const lengthB = getMaxVehicleLength(b);
        if (lengthA !== lengthB) return lengthA - lengthB;
        
        // При равных размерах — по цене (дешевле сначала)
        return a.price - b.price;
      });
    } else {
      // Стандартная сортировка по выбранной опции
      result.sort((a, b) => {
        switch (sortOption) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'availability': {
            const availOrder = { in_stock: 0, days_1_3: 1, days_7_14: 2 };
            return (availOrder[a.availability] ?? 3) - (availOrder[b.availability] ?? 3);
          }
          case 'axles_asc':
            return getAxlesCount(a) - getAxlesCount(b);
          case 'axles_desc':
            return getAxlesCount(b) - getAxlesCount(a);
          case 'brakes':
            return getFullWeight(b) - getFullWeight(a);
          case 'length_desc':
            return parseDimensions(b.dimensions).length - parseDimensions(a.dimensions).length;
          case 'area_desc': {
            const dimA = parseDimensions(a.dimensions);
            const dimB = parseDimensions(b.dimensions);
            return dimB.length * dimB.width - dimA.length * dimA.width;
          }
          case 'volume_desc': {
            const volA = parseDimensions(a.dimensions);
            const volB = parseDimensions(b.dimensions);
            return volB.length * volB.width * volB.height - volA.length * volA.width * volA.height;
          }
          case 'boat_length_desc':
            return parseBoatLength(b.bodyDimensions) - parseBoatLength(a.bodyDimensions);
          case 'name_asc':
            return a.model.localeCompare(b.model);
          case 'name_desc':
            return b.model.localeCompare(a.model);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [trailers, filters]);

  return {
    filteredTrailers,
    totalCount: filteredTrailers.length,
  };
};
