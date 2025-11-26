import { Search } from 'lucide-react';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CatalogSearch = ({ value, onChange, onSubmit }: CatalogSearchProps) => {
  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <input
        type="text"
        placeholder="Поиск: лодка 3.5м, снегоход, эвакуатор..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
      />
      <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
};
