/**
 * Компонент отображения цены
 * - Форматирование числа
 * - Старая цена (зачёркнутая)
 * - Цвет в зависимости от скидки
 * - "Цена по запросу" для нулевых цен
 */

import { formatPrice } from '../../utils';

export interface PriceProps {
  /** Текущая цена */
  price: number;
  /** Старая цена (для отображения скидки) */
  oldPrice?: number;
  /** Размер текста */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Показывать подпись "Цена дилера" */
  showLabel?: boolean;
  /** Кастомная подпись */
  label?: string;
  /** Дополнительные CSS классы */
  className?: string;
  /** Выравнивание */
  align?: 'left' | 'center' | 'right';
}

export const Price = ({
  price,
  oldPrice,
  size = 'lg',
  showLabel = false,
  label = 'Цена дилера',
  className = '',
  align = 'left',
}: PriceProps) => {
  const hasDiscount = oldPrice && oldPrice > price;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Цена по запросу
  if (price <= 0) {
    return (
      <div className={`${alignClasses[align]} ${className}`}>
        <p className={`font-bold text-gray-700 dark:text-gray-300 ${sizeClasses[size]}`}>
          Цена по запросу
        </p>
        {showLabel && (
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
            Позвоните нам
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`${alignClasses[align]} ${className}`}>
      {/* Старая цена (зачёркнутая) */}
      {hasDiscount && (
        <p className="text-sm text-gray-400 line-through">
          {formatPrice(oldPrice)} ₽
        </p>
      )}

      {/* Текущая цена */}
      <p
        className={`font-bold ${sizeClasses[size]} ${
          hasDiscount
            ? 'text-green-600 dark:text-green-400'
            : 'text-blue-700 dark:text-blue-400'
        }`}
      >
        {formatPrice(price)} ₽
      </p>

      {/* Подпись */}
      {showLabel && (
        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
          {label}
        </p>
      )}
    </div>
  );
};

export default Price;
