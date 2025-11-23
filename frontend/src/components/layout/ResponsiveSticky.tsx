import { ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface ResponsiveStickyProps {
  children: ReactNode;
  stickyAt?: 'md' | 'lg' | 'xl';
  maxHeight?: string;
  mobileScroll?: boolean;
  className?: string;
  offsetClass?: string;
}

const breakpointValue = {
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const ResponsiveSticky = ({
  children,
  stickyAt = 'md',
  maxHeight = 'calc(100vh - 160px)',
  mobileScroll = false,
  className = '',
  offsetClass = 'top-24',
}: ResponsiveStickyProps) => {
  const { width } = useBreakpoint();
  const stickyEnabled = width >= breakpointValue[stickyAt];

  return (
    <div
      className={[
        stickyEnabled ? `sticky ${offsetClass}` : '',
        mobileScroll ? 'overflow-y-auto' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={stickyEnabled ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
};
