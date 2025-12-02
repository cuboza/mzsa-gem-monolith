/**
 * Универсальный компонент бейджа
 * Используется для статусов наличия, акций, новинок и т.д.
 */

import { ReactNode } from 'react';

export type BadgeVariant =
  | 'success'   // Зелёный (В наличии)
  | 'warning'   // Жёлтый (Хит)
  | 'danger'    // Красный (Акция)
  | 'info'      // Синий (1-3 дня)
  | 'purple'    // Фиолетовый (Новинка)
  | 'orange'    // Оранжевый (Кастомный бейдж)
  | 'neutral';  // Серый (7-14 дней)

export interface BadgeProps {
  /** Текст бейджа */
  children: ReactNode;
  /** Вариант цвета */
  variant?: BadgeVariant;
  /** Иконка слева */
  icon?: ReactNode;
  /** Размер */
  size?: 'xs' | 'sm' | 'md';
  /** Скруглённые углы (pill) */
  rounded?: boolean;
  /** Дополнительные классы */
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-400 text-gray-900',
  danger: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  purple: 'bg-purple-500 text-white',
  orange: 'bg-orange-600 text-white',
  neutral: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge = ({
  children,
  variant = 'neutral',
  icon,
  size = 'sm',
  rounded = true,
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={`
        inline-flex items-center font-bold shadow-sm
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${rounded ? 'rounded-full' : 'rounded'}
        ${className}
      `.trim()}
    >
      {icon && <span className="mr-1 flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// ============================================================================
// ПРЕДУСТАНОВЛЕННЫЕ БЕЙДЖИ
// ============================================================================

export interface PresetBadgeProps {
  className?: string;
}

/** Бейдж "Новинка" */
export const NewBadge = ({ className }: PresetBadgeProps) => (
  <Badge
    variant="purple"
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    }
    className={className}
  >
    Новинка
  </Badge>
);

/** Бейдж "Акция" */
export const SaleBadge = ({ className }: PresetBadgeProps) => (
  <Badge
    variant="danger"
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    }
    className={className}
  >
    Акция
  </Badge>
);

/** Бейдж "Скидка" */
export const DiscountBadge = ({ className }: PresetBadgeProps) => (
  <Badge
    variant="success"
    icon={
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    }
    className={className}
  >
    Скидка
  </Badge>
);

/** Бейдж "Хит" */
export const PopularBadge = ({ className }: PresetBadgeProps) => (
  <Badge
    variant="warning"
    icon={
      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    }
    className={className}
  >
    Хит
  </Badge>
);

export default Badge;
