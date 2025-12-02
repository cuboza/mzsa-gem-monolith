/**
 * Бейдж доступности товара
 * Использует многоскладскую модель для расчёта наличия и сроков доставки
 */
import { Check, Clock, Truck, Package } from 'lucide-react';
import { Badge } from './Badge';
import type { AvailabilityResult } from '../../features/stock';

interface AvailabilityBadgeProps {
  availability: AvailabilityResult;
  size?: 'sm' | 'md';
  className?: string;
}

export function AvailabilityBadge({ availability, size = 'sm', className = '' }: AvailabilityBadgeProps) {
  // Определяем вариант и иконку
  let variant: 'success' | 'info' | 'warning' | 'neutral';
  let Icon: typeof Check;

  if (availability.isAvailable) {
    if (availability.isLocalStock) {
      // Есть на местном складе
      variant = 'success';
      Icon = Check;
    } else {
      // Доставка из другого города
      variant = 'info';
      Icon = Truck;
    }
  } else {
    // Под заказ
    variant = 'neutral';
    Icon = Clock;
  }

  return (
    <Badge 
      variant={variant}
      size={size}
      className={`flex items-center gap-1 ${className}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} strokeWidth={3} />
      {availability.label}
    </Badge>
  );
}

/**
 * Компактный бейдж только с иконкой (для списков)
 */
interface AvailabilityIconProps {
  isAvailable: boolean;
  isLocalStock?: boolean;
  className?: string;
}

export function AvailabilityIcon({ isAvailable, isLocalStock = false, className = '' }: AvailabilityIconProps) {
  if (!isAvailable) {
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 ${className}`}>
        <Clock size={12} className="text-gray-500 dark:text-gray-400" />
      </span>
    );
  }

  if (isLocalStock) {
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 ${className}`}>
        <Check size={12} className="text-white" strokeWidth={3} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 ${className}`}>
      <Truck size={12} className="text-white" />
    </span>
  );
}
