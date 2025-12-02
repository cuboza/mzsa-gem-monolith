import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Тип для имен иконок (только компоненты иконок)
export type IconName = keyof typeof LucideIcons;

// Список доступных иконок для Hero слайдов
export const HERO_ICON_NAMES: string[] = [
  'Ruler', 'Anchor', 'Package', 'Settings', 'Wrench', 
  'Truck', 'Shield', 'Award', 'CheckCircle', 'Zap',
  'Layers', 'Lock', 'Gauge', 'Box', 'MapPin'
];

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Компонент для рендеринга Lucide иконки по имени
 */
export function DynamicIcon({ name, className = '', size = 20 }: IconProps): React.ReactElement | null {
  // Получаем иконку из экспортов lucide-react
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  
  if (!IconComponent || typeof IconComponent !== 'function') {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <IconComponent className={className} size={size} />;
}

/**
 * Проверка существования иконки
 */
export function isValidIconName(name: string): name is IconName {
  return name in LucideIcons;
}
