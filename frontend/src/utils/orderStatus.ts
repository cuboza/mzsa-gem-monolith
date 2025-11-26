/**
 * Утилиты для работы со статусами заказов
 */

export type OrderStatus = 'new' | 'processing' | 'shipping' | 'ready' | 'completed' | 'cancelled';

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  new: {
    label: 'Новый',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700'
  },
  processing: {
    label: 'В работе',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700'
  },
  shipping: {
    label: 'В пути',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700'
  },
  ready: {
    label: 'Готов к выдаче',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  completed: {
    label: 'Завершен',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  cancelled: {
    label: 'Отменен',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700'
  }
};

/**
 * Получить текстовую метку статуса
 */
export const getStatusLabel = (status: string): string => {
  return STATUS_CONFIG[status as OrderStatus]?.label || status;
};

/**
 * Получить CSS-классы для статуса (bg + text)
 */
export const getStatusClasses = (status: string): string => {
  const config = STATUS_CONFIG[status as OrderStatus];
  if (!config) return 'bg-gray-100 text-gray-600';
  return `${config.bgColor} ${config.textColor}`;
};

/**
 * Получить конфигурацию статуса
 */
export const getStatusConfig = (status: string): StatusConfig => {
  return STATUS_CONFIG[status as OrderStatus] || {
    label: status,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600'
  };
};

/**
 * Все доступные статусы
 */
export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'processing', 
  'shipping',
  'ready',
  'completed',
  'cancelled'
];
