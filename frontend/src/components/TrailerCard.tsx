import { Trailer } from '../types';
import { Star, Heart, Truck, Check, Percent, Flame, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { formatPrice } from '../utils';

// Хелперы для извлечения данных из specs или legacy полей
const getAxlesCount = (trailer: Trailer): number => {
  // Сначала из specs.kol_vo_osey_kolyos (например "1/2" или "2/4")
  const kolVo = trailer.specs?.kol_vo_osey_kolyos;
  if (kolVo && typeof kolVo === 'string') {
    const match = kolVo.match(/^(\d+)/);
    if (match) return parseInt(match[1]);
  }
  // Потом из specs.axles
  if (trailer.specs?.axles) return trailer.specs.axles;
  // Потом из legacy поля axles
  return 1;
};

const getCapacity = (trailer: Trailer): number | null => {
  // Сначала из specs.gruzopodemnost
  if (trailer.specs?.gruzopodemnost) return trailer.specs.gruzopodemnost;
  // Потом из legacy поля capacity
  if (trailer.capacity) return trailer.capacity;
  return null;
};

const getBodyDimensions = (trailer: Trailer): string | null => {
  // Для лодочных - длина судна
  if (trailer.specs?.dlina_sudna) return trailer.specs.dlina_sudna;
  // Размеры кузова из specs
  if (trailer.specs?.razmery_kuzova) return trailer.specs.razmery_kuzova;
  // Legacy поля
  if (trailer.bodyDimensions) return trailer.bodyDimensions;
  if (trailer.dimensions) return trailer.dimensions;
  return null;
};

const hasBrakes = (trailer: Trailer): boolean => {
  // Проверяем specs.tormoz
  const tormoz = trailer.specs?.tormoz;
  if (tormoz && typeof tormoz === 'string') {
    const lowerTormoz = tormoz.toLowerCase();
    if (lowerTormoz.includes('без тормоз') || lowerTormoz.includes('нет')) {
      return false;
    }
    if (lowerTormoz.includes('тормоз наката') || lowerTormoz.includes('есть')) {
      return true;
    }
  }
  // Legacy поле brakes
  if (trailer.brakes && trailer.brakes !== 'Нет') return true;
  return false;
};

interface TrailerCardProps {
  trailer: Trailer;
  onOrder?: (trailer: Trailer) => void;
  onClick?: (trailer: Trailer) => void;
  selected?: boolean;
  hideActions?: boolean;
}

export const TrailerCard = ({ trailer, onOrder, onClick, selected, hideActions }: TrailerCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Сброс состояния при изменении изображения
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [trailer.image]);

  // Используем formatPrice из utils/

  return (
    <div 
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border flex flex-col h-full group cursor-pointer relative transform hover:-translate-y-1 ${
        selected 
          ? 'border-blue-600 ring-2 ring-blue-200' 
          : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={() => onClick?.(trailer)}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white p-1 rounded-full shadow-md">
          <Check size={20} />
        </div>
      )}

      {/* Изображение */}
      <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
        {trailer.image && !imageError ? (
          <>
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                <Truck size={32} className="text-gray-300" />
              </div>
            )}
            <img 
              src={trailer.image} 
              alt={trailer.model} 
              className={`w-full h-full object-contain p-4 transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Truck size={48} className="opacity-50" />
            <span className="text-xs mt-2 text-gray-300">Нет фото</span>
          </div>
        )}
        
        {/* Бейджи */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {trailer.isNew && (
            <span className="bg-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
              <Sparkles size={12} className="mr-1" />
              Новинка
            </span>
          )}
          {trailer.isOnSale && (
            <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
              <Flame size={12} className="mr-1" />
              Акция
            </span>
          )}
          {trailer.isPriceReduced && (
            <span className="bg-green-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
              <Percent size={12} className="mr-1" />
              Скидка
            </span>
          )}
          {trailer.isPopular && !trailer.isNew && !trailer.isOnSale && (
            <span className="bg-yellow-400 text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center">
              <Star size={12} className="mr-1 fill-current" />
              Хит
            </span>
          )}
          {trailer.badge && !trailer.isNew && !trailer.isOnSale && !trailer.isPriceReduced && (
            <span className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
              {trailer.badge}
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

          {/* Ключевые характеристики (сокращённый вид) */}
          <div className="space-y-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
            {/* Размеры кузова или длина судна для лодочных */}
            {(() => {
              const dims = getBodyDimensions(trailer);
              if (!dims) return null;
              const isBoat = trailer.category === 'water' || trailer.specs?.dlina_sudna;
              return (
                <div className="flex justify-between">
                  <span className="text-gray-500">{isBoat ? 'Длина судна:' : 'Кузов:'}</span>
                  <span className="font-semibold text-gray-900">{dims}</span>
                </div>
              );
            })()}
            
            {/* Количество осей */}
            <div className="flex justify-between">
              <span className="text-gray-500">Осей:</span>
              <span className="font-semibold text-gray-900">{getAxlesCount(trailer)}</span>
            </div>
            
            {/* Тормоза */}
            <div className="flex justify-between">
              <span className="text-gray-500">Тормоз:</span>
              <span className={`font-semibold ${hasBrakes(trailer) ? 'text-green-600' : 'text-gray-500'}`}>
                {hasBrakes(trailer) ? 'Есть' : 'Нет'}
              </span>
            </div>
            
            {/* Грузоподъёмность */}
            {(() => {
              const cap = getCapacity(trailer);
              if (!cap) return null;
              return (
                <div className="flex justify-between">
                  <span className="text-gray-500">Г/п:</span>
                  <span className="font-semibold text-gray-900">{cap} кг</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Низ карточки */}
        <div className="pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              {trailer.oldPrice && trailer.oldPrice > trailer.price && (
                <p className="text-sm text-gray-400 line-through">
                  {formatPrice(trailer.oldPrice)} ₽
                </p>
              )}
              <p className={`text-2xl font-bold ${trailer.oldPrice && trailer.oldPrice > trailer.price ? 'text-green-600' : 'text-blue-700'}`}>
                {formatPrice(trailer.price)} ₽
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Цена дилера</p>
            </div>
            {!hideActions && (
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            )}
          </div>

          {!hideActions && (
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
                {trailer.availability === 'in_stock' ? 'Купить' : 'Заказать'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

