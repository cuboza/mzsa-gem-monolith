/**
 * Утилиты для оптимизации изображений
 */

/**
 * Генерирует srcset для responsive images
 * Если изображение локальное, пытается найти оптимизированные версии
 */
export const generateSrcSet = (
  src: string,
  sizes: number[] = [320, 640, 960, 1280]
): string | undefined => {
  // Для внешних URL не генерируем srcset
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return undefined;
  }

  // Для локальных изображений предполагаем наличие оптимизированных версий
  // /images/hero/hero.jpg -> /images/hero/hero-320w.jpg, hero-640w.jpg etc.
  const ext = src.split('.').pop();
  const basePath = src.replace(`.${ext}`, '');

  return sizes.map(size => `${basePath}-${size}w.${ext} ${size}w`).join(', ');
};

/**
 * Получает sizes атрибут для типичных случаев использования
 */
export const getImageSizes = (context: 'card' | 'hero' | 'modal' | 'thumbnail'): string => {
  switch (context) {
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
    case 'hero':
      return '100vw';
    case 'modal':
      return '(max-width: 768px) 100vw, 800px';
    case 'thumbnail':
      return '100px';
    default:
      return '100vw';
  }
};

/**
 * Проверяет поддержку WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Заменяет расширение на webp если поддерживается
 */
export const getOptimalImageSrc = (src: string): string => {
  if (supportsWebP() && !src.includes('.webp')) {
    const ext = src.split('.').pop();
    if (ext && ['jpg', 'jpeg', 'png'].includes(ext.toLowerCase())) {
      // Проверяем наличие webp версии (предполагаем что она есть)
      return src.replace(`.${ext}`, '.webp');
    }
  }
  return src;
};

/**
 * Placeholder для отложенной загрузки (blur или solid color)
 */
export const getPlaceholder = (width: number, height: number, color = '#f3f4f6'): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
};
