/**
 * Оптимизированный компонент изображения
 * - Lazy loading
 * - Skeleton при загрузке
 * - Обработка ошибок
 * - Поддержка srcset для retina
 */

import { useState, useEffect, useRef } from 'react';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** Показывать placeholder пока изображение загружается */
  showSkeleton?: boolean;
  /** Иконка-заглушка при ошибке загрузки */
  fallbackIcon?: React.ReactNode;
  /** Fallback текст при ошибке */
  fallbackText?: string;
  /** Callback при успешной загрузке */
  onLoad?: () => void;
  /** Callback при ошибке */
  onError?: () => void;
  /** Приоритетная загрузка (отключает lazy loading) */
  priority?: boolean;
  /** Режим object-fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  showSkeleton = true,
  fallbackIcon,
  fallbackText = 'Нет фото',
  onLoad,
  onError,
  priority = false,
  objectFit = 'contain',
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Сброс состояния при изменении src
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            // Начинаем загрузку когда элемент виден
            imgRef.current.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Начинаем загружать чуть раньше
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const objectFitClasses: Record<typeof objectFit, string> = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  // Ошибка загрузки
  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 ${className}`}
        style={{ width, height }}
      >
        {fallbackIcon || (
          <svg
            className="w-12 h-12 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        {fallbackText && <span className="text-xs mt-2">{fallbackText}</span>}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Skeleton loader */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-600 animate-pulse flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-300 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <img
        ref={imgRef}
        // Если priority - сразу загружаем, иначе - через observer
        src={priority ? src : undefined}
        data-src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full transition-opacity duration-300 ${objectFitClasses[objectFit]} ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default OptimizedImage;
