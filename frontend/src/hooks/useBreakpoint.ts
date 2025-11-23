import { useEffect, useState } from 'react';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

const breakpointOrder: BreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl'];

const getBreakpoint = (width: number): BreakpointKey => {
  let current: BreakpointKey = 'sm';
  breakpointOrder.forEach(bp => {
    if (width >= BREAKPOINTS[bp]) {
      current = bp;
    }
  });
  return current;
};

export const useBreakpoint = () => {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.sm));
  const [active, setActive] = useState<BreakpointKey>(() => getBreakpoint(width));

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setActive(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAtLeast = (bp: BreakpointKey) => width >= BREAKPOINTS[bp];
  const isBelow = (bp: BreakpointKey) => width < BREAKPOINTS[bp];

  return { width, active, isAtLeast, isBelow };
};
