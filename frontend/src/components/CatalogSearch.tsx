import { Search, X, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchVehicles, SearchResult } from '../features/vehicles/vehicleSearch';
import vehiclesDb from '../data/vehiclesDatabase.json';
import { VehicleModel } from '../features/vehicles/vehicleTypes';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  onVehicleSelect?: (vehicle: VehicleModel) => void;
}

export const CatalogSearch = ({ value, onChange, onVehicleSelect }: CatalogSearchProps) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.length > 1) {
      // @ts-ignore - vehiclesDb structure might need casting
      const results = searchVehicles(vehiclesDb.vehicles as VehicleModel[], value, { limit: 5 });
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  const handleSelect = (vehicle: VehicleModel) => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
    
    // Update text to vehicle name
    onChange(`${vehicle.brand} ${vehicle.model}`);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        placeholder="Поиск: лодка 3.5м, снегоход, BRP, Yamaha..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length > 1 && setIsOpen(true)}
        className="w-full pl-10 pr-10 py-2.5 border dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
      {value && (
        <button 
          type="button"
          onClick={() => {
            onChange('');
            setSuggestions([]);
            if (onVehicleSelect) {
              // @ts-ignore - passing null to reset
              onVehicleSelect(null);
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <div className="py-1">
            {suggestions.map(({ vehicle }) => (
              <button
                key={vehicle.id}
                onClick={() => handleSelect(vehicle)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {vehicle.brand} {vehicle.model}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {vehicle.type} • {vehicle.length}x{vehicle.width} мм
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
