import { useState, useEffect, useMemo } from 'react';
import { db } from '../services/api';
import type { HeroSlide } from '../types';

// Дефолтные слайды (используются если в настройках ничего нет)
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    image: '/images/hero/hero-freedom.png',
    title: 'Свобода не знает границ.',
    subtitle: 'Твой прицеп — тоже.',
    description: 'Бортовые прицепы от 1.8 до 4.6 м кузова • Лодочные от 3 до 9 м судна • Фургоны от 5 до 8 м³ объёма • Грузоподъёмность до 2.6 тонн',
    features: [
      { icon: 'Ruler', text: 'Кузов: 1853×1231 — 4587×1511 мм' },
      { icon: 'Anchor', text: 'Судно: 3000 — 9000 мм' },
      { icon: 'Package', text: 'Фургоны: 5 — 7.9 м³' }
    ],
    ctaText: 'Подобрать размер',
    ctaLink: '/configurator',
    order: 0,
    isActive: true
  },
  {
    id: '2',
    image: '/images/hero/hero-comfort.jpg',
    title: 'Не выбирай между уютом и приключениями.',
    subtitle: 'Бери всё сразу.',
    description: 'Тенты 15+ конфигураций и цветов • Дуги, стойки, каркасы • Лебёдки и ложементы для лодок • Крылья, борта, аппарели',
    features: [
      { icon: 'Settings', text: 'Тенты: плоские, высокие, каркасные' },
      { icon: 'Anchor', text: 'Лодочные: ролики, кильблоки, лебёдки' },
      { icon: 'Wrench', text: '136 аксессуаров в наличии' }
    ],
    ctaText: 'Выбрать опции',
    ctaLink: '/catalog',
    order: 1,
    isActive: true
  },
  {
    id: '3',
    image: '/images/hero/hero-takeall.png',
    title: 'Возьми всё.',
    subtitle: 'Один прицеп — тысяча возможностей.',
    description: 'Снегоход зимой, лодка летом, стройматериалы круглый год. Универсальные прицепы МЗСА адаптируются под любую задачу.',
    features: [
      { icon: 'Truck', text: 'Универсальные: мото, груз, техника' },
      { icon: 'Shield', text: 'Оцинковка: защита от коррозии' },
      { icon: 'Award', text: 'Гарантия 1 год от завода' }
    ],
    ctaText: 'Смотреть каталог',
    ctaLink: '/catalog',
    order: 2,
    isActive: true
  }
];

interface UseHeroSlidesResult {
  slides: HeroSlide[];
  loading: boolean;
  error: string | null;
}

export function useHeroSlides(): UseHeroSlidesResult {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSlides = async () => {
      try {
        const settings = await db.getSettings();
        
        if (!mounted) return;

        if (settings?.heroSlides && settings.heroSlides.length > 0) {
          // Фильтруем только активные и сортируем по order
          const activeSlides = settings.heroSlides
            .filter(slide => slide.isActive)
            .sort((a, b) => a.order - b.order);
          
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          } else {
            // Если все слайды неактивны, используем дефолтные
            setSlides(DEFAULT_SLIDES);
          }
        }
        // Если heroSlides нет в настройках, оставляем дефолтные
        
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load hero slides:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки слайдов');
        setLoading(false);
        // При ошибке используем дефолтные слайды
      }
    };

    loadSlides();

    return () => {
      mounted = false;
    };
  }, []);

  // Мемоизируем результат
  const result = useMemo(() => ({
    slides,
    loading,
    error
  }), [slides, loading, error]);

  return result;
}

export { DEFAULT_SLIDES };
