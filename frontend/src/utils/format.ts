/**
 * Утилиты форматирования данных
 */

/**
 * Форматирование цены в рублях
 * @param price - числовое значение цены
 * @returns строка вида "1 234 567"
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

/**
 * Форматирование даты и времени
 * @param date - строка ISO даты или Date объект
 * @returns строка вида "26 ноября 2025, 14:30"
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирование даты (без времени)
 * @param date - строка ISO даты или Date объект
 * @returns строка вида "26 ноября 2025"
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Форматирование короткой даты
 * @param date - строка ISO даты или Date объект
 * @returns строка вида "26.11.2025"
 */
export const formatDateShort = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ru-RU');
};

/**
 * Форматирование телефона
 * @param phone - строка телефона
 * @returns отформатированный телефон
 */
export const formatPhone = (phone: string): string => {
  // Убираем всё кроме цифр
  const digits = phone.replace(/\D/g, '');
  
  // Форматируем как +7 (XXX) XXX-XX-XX
  if (digits.length === 11 && digits[0] === '7') {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  
  return phone;
};
