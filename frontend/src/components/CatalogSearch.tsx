import { Search, X } from 'lucide-react';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const CatalogSearch = ({ value, onChange }: CatalogSearchProps) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Поиск: лодка 3.5м, снегоход, эвакуатор..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      {value && (
        <button 
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
