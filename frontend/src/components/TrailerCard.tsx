import { Trailer } from '../types';
import { Heart, Truck, Check, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Badge, NewBadge, SaleBadge, DiscountBadge, PopularBadge, Price, OptimizedImage, AvailabilityBadge } from './ui';
import {
  getAxlesCount,
  getCapacity,
  getBodyDimensions,
  hasBrakes,
  getMainImage,
} from '../features/trailers';
import { useTrailerAvailability } from '../hooks/useAvailability';

// Хелперы теперь импортируются из features/trailers

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

  // Расчёт доступности с учётом города пользователя
  const availability = useTrailerAvailability(trailer);

  // Получаем URL изображения из утилиты
  const imageUrl = getMainImage(trailer);

  // Сброс состояния при изменении изображения
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  // Используем formatPrice из utils/

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border flex flex-col h-full group cursor-pointer relative transform hover:-translate-y-1 ${
        selected 
          ? 'border-blue-600 ring-2 ring-blue-200' 
          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
      }`}
      onClick={() => onClick?.(trailer)}
    >
      {selected && (
        <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white p-1 rounded-full shadow-md">
          <Check size={20} />
        </div>
      )}

      {/* Изображение */}
      <div className="relative h-40 sm:h-44 bg-white flex items-center justify-center overflow-hidden rounded-t-xl">
        {imageUrl && !imageError ? (
          <>
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-600 animate-pulse flex items-center justify-center">
                <Truck size={32} className="text-gray-300 dark:text-gray-500" />
              </div>
            )}
            <img 
              src={imageUrl} 
              alt={trailer.model} 
              className={`w-full h-full object-contain p-2 transition-all duration-300 ${
                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Truck size={48} className="opacity-50" />
            <span className="text-xs mt-2 text-gray-300 dark:text-gray-500">Нет фото</span>
          </div>
        )}
        
        {/* Бейджи - используем компоненты из ui */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
          {trailer.isNew && <NewBadge />}
          {trailer.isOnSale && <SaleBadge />}
          {trailer.isPriceReduced && <DiscountBadge />}
          {trailer.isPopular && !trailer.isNew && !trailer.isOnSale && <PopularBadge />}
          {trailer.badge && !trailer.isNew && !trailer.isOnSale && !trailer.isPriceReduced && (
            <Badge variant="orange">{trailer.badge}</Badge>
          )}
        </div>

        {/* Наличие - используем расчёт по городу */}
        <AvailabilityBadge 
          availability={availability}
          size="sm"
          className="absolute top-2 right-2 sm:top-3 sm:right-3"
        />
      </div>

      {/* Контент */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="font-bold text-base sm:text-lg mb-0.5 sm:mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 dark:text-white">
            {trailer.model}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
            {trailer.name}
          </p>

          {/* Ключевые характеристики (сокращённый вид) */}
          <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700 p-2 sm:p-2.5 rounded-lg">
            {/* Размеры кузова или длина судна для лодочных */}
            {(() => {
              const dims = getBodyDimensions(trailer);
              if (!dims) return null;
              const isBoat = trailer.category === 'water' || trailer.specs?.dlina_sudna;
              return (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{isBoat ? 'Длина судна:' : 'Кузов:'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{dims}</span>
                </div>
              );
            })()}
            
            {/* Количество осей */}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Осей:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{getAxlesCount(trailer)}</span>
            </div>
            
            {/* Тормоза */}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Тормоз:</span>
              <span className={`font-semibold ${hasBrakes(trailer) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {hasBrakes(trailer) ? 'Есть' : 'Нет'}
              </span>
            </div>
            
            {/* Грузоподъёмность */}
            {(() => {
              const cap = getCapacity(trailer);
              if (!cap) return null;
              return (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Г/п:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{cap} кг</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Низ карточки */}
        <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <div className="flex items-end justify-between mb-2 sm:mb-3">
            <Price 
              price={trailer.price} 
              oldPrice={trailer.oldPrice}
              showLabel
            />
            {!hideActions && (
              <button className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {!hideActions && (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/configurator', { state: { trailer } });
                }}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
              >
                Конфигуратор
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOrder ? onOrder(trailer) : navigate('/configurator', { state: { trailer } });
                }}
                className="bg-orange-600 hover:bg-orange-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center"
              >
                {availability.isAvailable ? 'Купить' : 'Заказать'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

