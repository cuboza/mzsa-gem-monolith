/**
 * Контекст для управления городом пользователя
 * Используется для расчёта доступности товаров и сроков доставки
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Города сети магазинов
export const CITIES = ['Сургут', 'Нижневартовск', 'Ноябрьск', 'Новый Уренгой'] as const;
export type City = typeof CITIES[number];

interface CityContextType {
  city: City;
  setCity: (city: City) => void;
  cities: readonly City[];
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const STORAGE_KEY = 'onr_user_city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState<City>(() => {
    // Восстанавливаем из localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CITIES.includes(saved as City)) {
      return saved as City;
    }
    // Дефолтный город — Сургут (главный офис)
    return 'Сургут';
  });

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, city);
  }, [city]);

  const value: CityContextType = {
    city,
    setCity,
    cities: CITIES,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextType {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}

/**
 * Хук для получения города без ошибки (для использования вне CityProvider)
 */
export function useCitySafe(): CityContextType {
  const context = useContext(CityContext);
  if (!context) {
    return {
      city: 'Сургут',
      setCity: () => {},
      cities: CITIES,
    };
  }
  return context;
}
