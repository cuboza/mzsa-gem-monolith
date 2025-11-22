import { Trailer } from '../types';
import { Star, Heart, Truck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrailerCardProps {
  trailer: Trailer;
  onOrder?: (trailer: Trailer) => void;
  onClick?: (trailer: Trailer) => void;
}

export const TrailerCard = ({ trailer, onOrder, onClick }: TrailerCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group cursor-pointer"
      onClick={() => onClick?.(trailer)}
    >
      {/* Изображение */}
      <div className="relative h-48 bg-gray-100 overflow-hidden group-hover:opacity-95 transition-opacity">
        {trailer.image ? (
          <img 
            src={trailer.image} 
            alt={trailer.model} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Try a placeholder if the main image fails (e.g. hotlinking protection)
              if (!target.src.includes('placehold.co')) {
                target.src = `https://placehold.co/600x400?text=${encodeURIComponent(trailer.model)}`;
              } else {
                // If placeholder also fails, hide image and show icon
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }
            }}
          />
        ) : null}
        
        <div className={`absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-200 ${trailer.image ? 'hidden' : ''}`}>
          <Truck size={48} className="opacity-50" />
        </div>
        
        {/* Бейджи */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {trailer.badge && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {trailer.badge}
            </span>
          )}
          {trailer.isPopular && (
            <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
              <Star size={12} className="mr-1 fill-current" />
              Хит
            </span>
          )}
        </div>

        {/* Наличие */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          trailer.availability === 'in_stock' 
            ? 'bg-green-500 text-white' 
            : trailer.availability === 'days_1_3'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {trailer.availability === 'in_stock' ? 'В наличии' : 
           trailer.availability === 'days_1_3' ? '1-3 дня' : '7-14 дней'}
        </div>
      </div>

      {/* Контент */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
            {trailer.model}
          </h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
            {trailer.name}
          </p>

          {/* Характеристики */}
          <div className="space-y-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-500">Г/п:</span>
              <span className="font-semibold text-gray-900">{trailer.capacity} кг</span>
            </div>
            {trailer.dimensions && (
              <div className="flex justify-between">
                <span className="text-gray-500">Размеры кузова:</span>
                <span className="font-semibold text-gray-900">{trailer.dimensions}</span>
              </div>
            )}
            {trailer.boardHeight && (
              <div className="flex justify-between">
                <span className="text-gray-500">Высота борта:</span>
                <span className="font-semibold text-gray-900">{trailer.boardHeight} мм</span>
              </div>
            )}
            {trailer.gabarity && (
              <div className="flex justify-between">
                <span className="text-gray-500">Габариты:</span>
                <span className="font-semibold text-gray-900">{trailer.gabarity}</span>
              </div>
            )}
            {trailer.bodyDimensions && (
              <div className="flex justify-between">
                <span className="text-gray-500">Длина судна:</span>
                <span className="font-semibold text-gray-900">{trailer.bodyDimensions}</span>
              </div>
            )}
            {trailer.suspension && (
              <div className="flex justify-between">
                <span className="text-gray-500">Подвеска:</span>
                <span className="font-semibold text-gray-900">{trailer.suspension}</span>
              </div>
            )}
            {trailer.brakes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Тормоза:</span>
                <span className="font-semibold text-gray-900">{trailer.brakes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Низ карточки */}
        <div className="pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {formatPrice(trailer.price)} ₽
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Цена дилера</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/configurator', { state: { trailer } });
              }}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              Конфигуратор
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOrder ? onOrder(trailer) : navigate('/configurator', { state: { trailer } });
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold text-sm shadow-md transition-colors flex items-center justify-center"
            >
              Заказать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

