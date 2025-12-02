/**
 * Модуль trailers - централизованная бизнес-логика для работы с прицепами
 */

// Утилиты
export * from './trailerUtils';

// Константы
export * from './trailerConstants';

// Хуки
export { useTrailerFilters } from './useTrailerFilters';
export type { TrailerFilters, UseTrailerFiltersResult } from './useTrailerFilters';
