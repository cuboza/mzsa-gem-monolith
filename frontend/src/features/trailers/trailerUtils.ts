/**
 * Утилиты для работы с данными прицепов
 * Централизованная логика, которая раньше дублировалась в компонентах
 */

import { Trailer } from '../../types';

// ============================================================================
// ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ СПЕЦИФИКАЦИЙ
// ============================================================================

/**
 * Получает количество осей прицепа из различных источников данных
 */
export const getAxlesCount = (trailer: Trailer): number => {
  // Сначала из specs.kol_vo_osey_kolyos (например "1/2" или "2/4")
  const kolVo = trailer.specs?.kol_vo_osey_kolyos;
  if (kolVo && typeof kolVo === 'string') {
    const match = kolVo.match(/^(\d+)/);
    if (match) return parseInt(match[1]);
  }
  // Потом из specs.axles
  if (trailer.specs?.axles) return trailer.specs.axles;
  // Дефолт — 1 ось
  return 1;
};

/**
 * Получает грузоподъёмность из различных источников данных
 */
export const getCapacity = (trailer: Trailer): number | null => {
  // Сначала из specs.gruzopodemnost
  if (trailer.specs?.gruzopodemnost) return trailer.specs.gruzopodemnost;
  // Потом из legacy поля capacity
  if (trailer.capacity) return trailer.capacity;
  return null;
};

/**
 * Очищает дублирующиеся единицы измерения: "4300 мм мм судно" → "4300 мм"
 */
export const cleanDimension = (value: string): string => {
  const numberMatch = value.match(/^(\d+)/);
  if (numberMatch) {
    return `${numberMatch[1]} мм`;
  }
  return value.trim();
};

/**
 * Проверяет, является ли значение размером для лодки
 */
export const isBoatDimension = (value: string): boolean => {
  return /\d+\s*мм\s*мм\s*судно|\d+\s*мм\s*судно/.test(value);
};

/**
 * Получает размеры кузова из различных источников
 */
export const getBodyDimensions = (trailer: Trailer): string | null => {
  // Для лодочных — длина судна
  if (trailer.specs?.dlina_sudna) return cleanDimension(trailer.specs.dlina_sudna);
  // Размеры кузова из specs
  if (trailer.specs?.razmery_kuzova) return trailer.specs.razmery_kuzova;
  // Legacy поля — очищаем если это "мм мм судно"
  if (trailer.bodyDimensions) {
    return isBoatDimension(trailer.bodyDimensions) 
      ? cleanDimension(trailer.bodyDimensions) 
      : trailer.bodyDimensions;
  }
  if (trailer.dimensions) return trailer.dimensions;
  return null;
};

/**
 * Проверяет наличие тормозов у прицепа
 */
export const hasBrakes = (trailer: Trailer): boolean => {
  // Проверяем specs.tormoz
  const tormoz = trailer.specs?.tormoz;
  if (tormoz && typeof tormoz === 'string') {
    const lowerTormoz = tormoz.toLowerCase();
    if (lowerTormoz.includes('без тормоз') || lowerTormoz.includes('нет')) {
      return false;
    }
    if (lowerTormoz.includes('тормоз наката') || lowerTormoz.includes('есть')) {
      return true;
    }
  }
  // Legacy поле brakes
  if (trailer.brakes && trailer.brakes !== 'Нет') return true;
  return false;
};

/**
 * Получает полную массу прицепа в кг
 */
export const getFullWeight = (trailer: Trailer): number => {
  const weightStr = trailer.specs?.weight || '';
  const weight = parseInt(weightStr.replace(/\D/g, ''));
  return isNaN(weight) ? 0 : weight;
};

/**
 * Определяет, требуется ли категория B+ или E для этого прицепа
 */
export const requiresExtendedLicense = (trailer: Trailer): boolean => {
  return getFullWeight(trailer) > 750;
};

// ============================================================================
// ИЗОБРАЖЕНИЯ
// ============================================================================

/**
 * Получает URL главного изображения прицепа
 */
export const getMainImage = (trailer: Trailer): string | null => {
  return trailer.images?.[0] || trailer.image || null;
};

/**
 * Получает все изображения прицепа без дубликатов
 */
export const getAllImages = (trailer: Trailer): string[] => {
  const images: string[] = [];
  
  if (trailer.image) {
    images.push(trailer.image);
  }
  
  if (trailer.images && trailer.images.length > 0) {
    trailer.images.forEach(img => {
      if (img && !images.includes(img)) {
        images.push(img);
      }
    });
  }
  
  return images.length > 0 
    ? images 
    : [`https://placehold.co/600x400?text=${encodeURIComponent(trailer.model)}`];
};

// ============================================================================
// ТЕКСТОВЫЕ ЛЕЙБЛЫ
// ============================================================================

/**
 * Проверяет, есть ли товар в наличии (только stock > 0)
 */
export const isInStock = (trailer: Trailer): boolean => {
  // Товар в наличии ТОЛЬКО если есть остаток на складе > 0
  return !!(trailer.stock && trailer.stock > 0);
};

/**
 * Возвращает текстовый статус наличия
 * Приоритет: stock > 0 → "В наличии", иначе по availability (для сроков поставки)
 */
export const getAvailabilityLabel = (availability: Trailer['availability'], stock?: number): string => {
  // Если есть остаток > 0, показываем "В наличии"
  if (stock && stock > 0) {
    return 'В наличии';
  }
  // При нулевом остатке показываем срок поставки из availability
  const labels: Record<Trailer['availability'], string> = {
    in_stock: '1-3 дня',  // Даже если availability = 'in_stock', при stock = 0 показываем срок
    days_1_3: '1-3 дня',
    days_7_14: '7-14 дней',
  };
  return labels[availability] || 'Под заказ';
};

/**
 * Возвращает CSS-классы для бейджа наличия
 */
export const getAvailabilityClasses = (availability: Trailer['availability'], stock?: number): string => {
  // Зелёный бейдж ТОЛЬКО при остатке > 0
  if (stock && stock > 0) {
    return 'bg-green-500 text-white';
  }
  // При нулевом остатке — цвет по сроку поставки
  const classes: Record<Trailer['availability'], string> = {
    in_stock: 'bg-blue-500 text-white',  // При stock = 0 это уже не "В наличии"
    days_1_3: 'bg-blue-500 text-white',
    days_7_14: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
  };
  return classes[availability] || 'bg-gray-200 text-gray-700';
};

/**
 * Возвращает название категории прицепа
 */
export const getCategoryLabel = (category: Trailer['category']): string => {
  const labels: Record<Trailer['category'], string> = {
    general: 'Универсальный',
    water: 'Лодочный',
    commercial: 'Коммерческий',
  };
  return labels[category] || category;
};

/**
 * Определяет, является ли прицеп лодочным
 */
export const isBoatTrailer = (trailer: Trailer): boolean => {
  return trailer.category === 'water' || !!trailer.specs?.dlina_sudna;
};

// ============================================================================
// ПАРСИНГ РАЗМЕРОВ
// ============================================================================

export interface ParsedDimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * Парсит строку размеров "ДхШхВ" в объект
 */
export const parseDimensions = (dimStr?: string): ParsedDimensions => {
  if (!dimStr) return { length: 0, width: 0, height: 0 };
  const match = dimStr.match(/(\d+)[xх](\d+)[xх](\d+)/);
  if (match) {
    return {
      length: parseInt(match[1]),
      width: parseInt(match[2]),
      height: parseInt(match[3]),
    };
  }
  return { length: 0, width: 0, height: 0 };
};

/**
 * Парсит длину судна из строки
 */
export const parseBoatLength = (dimStr?: string): number => {
  if (!dimStr) return 0;
  const match = dimStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

/**
 * Получает максимальную длину техники, которую можно перевозить
 */
export const getMaxVehicleLength = (trailer: Trailer): number => {
  return (
    trailer.maxVehicleLength ||
    parseInt(String(trailer.specs?.dlina_sudna || '').replace(/\D/g, '')) ||
    parseInt(String(trailer.bodyDimensions || '').replace(/\D/g, '')) ||
    0
  );
};

/**
 * Получает объём фургона
 */
export const getVehicleVolume = (trailer: Trailer): number => {
  return (
    trailer.maxVehicleVolume ||
    parseFloat(String(trailer.specs?.objem_kuzova || '').replace(',', '.').replace(/[^\d.]/g, '')) ||
    0
  );
};
