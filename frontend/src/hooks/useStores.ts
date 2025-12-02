import { useState, useEffect, useMemo } from 'react';
import { db } from '../services/api';
import type { Store } from '../types';

// Дефолтные магазины (используются если в настройках ничего нет)
const DEFAULT_STORES: Store[] = [
  {
    id: 'store-1',
    city: 'Сургут',
    address: 'пр-т Мира, 55',
    phone: '+7 (3462) 22-33-55',
    phone2: '+7 (3462) 55-04-49',
    hours: '9:00-20:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjYBR',
    region: 'ХМАО',
    isMain: true,
    isActive: true,
    order: 0
  },
  {
    id: 'store-2',
    city: 'Нижневартовск',
    address: 'ул. Индустриальная, 11а',
    phone: '+7 (3466) 62-54-20',
    hours: '9:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjLTP',
    region: 'ХМАО',
    isActive: true,
    order: 1
  },
  {
    id: 'store-3',
    city: 'Ноябрьск',
    address: 'ул. Ленина, 22',
    phone: '+7 (3496) 42-46-14',
    hours: '10:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZj4y2',
    region: 'ЯНАО',
    isActive: true,
    order: 2
  },
  {
    id: 'store-4',
    city: 'Новый Уренгой',
    address: 'ул. Таёжная, 75',
    phone: '+7 (3494) 22-21-52',
    hours: '10:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjS~I',
    region: 'ЯНАО',
    isActive: true,
    order: 3
  }
];

interface UseStoresResult {
  stores: Store[];
  mainStore: Store | undefined;
  loading: boolean;
  error: string | null;
}

export function useStores(): UseStoresResult {
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStores = async () => {
      try {
        const settings = await db.getSettings();
        
        if (!mounted) return;

        if (settings?.stores && settings.stores.length > 0) {
          // Фильтруем только активные и сортируем по order
          const activeStores = settings.stores
            .filter(store => store.isActive)
            .sort((a, b) => a.order - b.order);
          
          if (activeStores.length > 0) {
            setStores(activeStores);
          }
        }
        // Если stores нет в настройках, оставляем дефолтные
        
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load stores:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки магазинов');
        setLoading(false);
      }
    };

    loadStores();

    return () => {
      mounted = false;
    };
  }, []);

  // Главный магазин
  const mainStore = useMemo(() => {
    return stores.find(s => s.isMain) || stores[0];
  }, [stores]);

  // Мемоизируем результат
  const result = useMemo(() => ({
    stores,
    mainStore,
    loading,
    error
  }), [stores, mainStore, loading, error]);

  return result;
}

export { DEFAULT_STORES };
