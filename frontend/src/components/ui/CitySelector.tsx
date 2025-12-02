/**
 * Компонент выбора города пользователя
 * Влияет на расчёт доступности и сроков доставки
 */
import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useCity, type City } from '../../context/CityContext';

interface CitySelectorProps {
  className?: string;
  variant?: 'header' | 'compact';
}

export function CitySelector({ className = '', variant = 'header' }: CitySelectorProps) {
  const { city, setCity, cities } = useCity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedCity: City) => {
    setCity(selectedCity);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <MapPin size={14} />
          <span>{city}</span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  c === city 
                    ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Header variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
        <span>{city}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-2 z-50 min-w-[180px]">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Выберите город
          </div>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                c === city 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <MapPin size={14} className={c === city ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
              {c}
            </button>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 px-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Город влияет на наличие и сроки доставки
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
