import React from 'react';
import { getStatusClasses, getStatusLabel } from '../../utils/orderStatus';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold
        ${getStatusClasses(status)}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {getStatusLabel(status)}
    </span>
  );
};
