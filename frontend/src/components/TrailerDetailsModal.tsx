import { useState, useMemo } from 'react';
import { Trailer, Accessory } from '../types';
import { X, Info, Check, ShoppingCart, Truck, Ruler, Weight, Shield, Activity, CircleOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { accessories } from '../data/accessories';
import { useNavigate } from 'react-router-dom';

interface TrailerDetailsModalProps {
  trailer: Trailer;
  onClose: () => void;
}

export const TrailerDetailsModal = ({ trailer, onClose }: TrailerDetailsModalProps) => {
  const navigate = useNavigate();
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hoveredAccessoryImage, setHoveredAccessoryImage] = useState<{url: string, x: number, y: number} | null>(null);

  const allImages = useMemo(() => {
    if (trailer.images && trailer.images.length > 0) {
      return trailer.images;
    }
    return [trailer.image];
  }, [trailer]);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Filter compatible accessories
  const compatibleAccessories = useMemo(() => {
    return accessories.filter(acc => {
      if (acc.compatibleWith.includes('all')) return true;
      if (acc.compatibleWith.includes(trailer.id)) return true;
      if (acc.compatibleWith.includes(trailer.category)) return true;
      if (trailer.compatibility) {
        return trailer.compatibility.some(c => acc.compatibleWith.includes(c));
      }
      return false;
    });
  }, [trailer]);

  const toggleAccessory = (id: string) => {
    setSelectedAccessoryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedAccessories = compatibleAccessories.filter(a => selectedAccessoryIds.includes(a.id));
  const optionsPrice = selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);
  const totalPrice = trailer.price + optionsPrice;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  // Determine suspension and brakes
  const suspensionType = trailer.suspension || 'Рессорная';
  const brakesType = trailer.brakes || 'Нет';

  const handleOrder = () => {
    // Navigate to configurator with pre-selected options or just handle order
    // For now, let's go to configurator with state
    navigate('/configurator', { 
      state: { 
        trailer, 
        initialAccessories: selectedAccessoryIds 
      } 
    });
  };

  const handleAccessoryMouseEnter = (e: React.MouseEvent, imageUrl: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredAccessoryImage({
      url: imageUrl,
      x: rect.right + 10,
      y: rect.top
    });
  };

  const handleAccessoryMouseLeave = () => {
    setHoveredAccessoryImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={32} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full view" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Accessory Hover Preview */}
      {hoveredAccessoryImage && (
        <div 
          className="fixed z-[70] pointer-events-none bg-white p-2 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            left: Math.min(hoveredAccessoryImage.x, window.innerWidth - 320), 
            top: Math.min(hoveredAccessoryImage.y, window.innerHeight - 320),
            width: '300px',
            height: '300px'
          }}
        >
          <img 
            src={hoveredAccessoryImage.url} 
            alt="Preview" 
            className="w-full h-full object-contain rounded-lg bg-gray-50"
          />
        </div>
      )}

      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Left Column: Image & Key Info */}
        <div className="w-full md:w-5/12 bg-gray-50 flex flex-col border-r border-gray-100 shrink-0">
          <div className="relative h-64 md:h-80 bg-white shrink-0 group cursor-zoom-in" onClick={() => setLightboxImage(allImages[currentImageIndex])}>
            <img 
              src={allImages[currentImageIndex]} 
              alt={trailer.model} 
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('placehold.co')) {
                  target.src = `https://placehold.co/600x400?text=${encodeURIComponent(trailer.model)}`;
                }
              }}
            />
            
            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                      className={`w-2 h-2 rounded-full transition-all shadow-sm ${
                        idx === currentImageIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <button 
              onClick={onClose}
              className="absolute top-4 left-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm transition-colors md:hidden z-20"
            >
              <X size={20} />
            </button>
            
            {trailer.badge && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                {trailer.badge}
              </div>
            )}
          </div>

          <div className="p-6 flex-grow flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{trailer.model}</h2>
            <p className="text-gray-500 mb-6">{trailer.name}</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Truck className="w-5 h-5 mr-3 text-blue-500" />
                <span>Размеры кузова: <strong>{trailer.dimensions || trailer.specs?.dimensions || '-'}</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Weight className="w-5 h-5 mr-3 text-blue-500" />
                <span>Грузоподъемность: <strong>{trailer.capacity || trailer.specs?.capacity || '-'} кг</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Ruler className="w-5 h-5 mr-3 text-blue-500" />
                <span>Габариты: <strong>{trailer.gabarity || trailer.specs?.dimensions || '-'}</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Activity className="w-5 h-5 mr-3 text-blue-500" />
                <span>Подвеска: <strong>{suspensionType}</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CircleOff className="w-5 h-5 mr-3 text-blue-500" />
                <span>Тормоза: <strong>{brakesType}</strong></span>
              </div>
            </div>

            <div className="mt-auto bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                <span>Прицеп:</span>
                <span>{formatPrice(trailer.price || 0)} ₽</span>
              </div>
              {optionsPrice > 0 && (
                <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                  <span>Опции:</span>
                  <span>+ {formatPrice(optionsPrice)} ₽</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-end">
                <span className="font-bold text-gray-900">Итого:</span>
                <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice || 0)} ₽</span>
              </div>
              
              <button 
                onClick={handleOrder}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md transition-all transform active:scale-95 flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Заказать
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Options */}
        <div className="w-full md:w-7/12 flex flex-col h-full max-h-[50vh] md:max-h-none">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">Конфигурация и опции</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
            {/* Full Info (Always Visible) */}
            <div className="mb-8">
              <div className="flex items-center text-blue-600 font-semibold mb-4">
                <Info className="w-5 h-5 mr-2" />
                Полное описание и характеристики
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-gray-700">
                <p className="mb-4">{trailer.description || "Надежный и универсальный прицеп для различных задач. Полностью оцинкованная рама методом горячего цинкования обеспечивает защиту от коррозии на долгие годы."}</p>
                
                <h4 className="font-bold mb-2 text-gray-900">Особенности модели:</h4>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  {trailer.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Полная масса</span>
                    <span className="font-semibold">750 кг</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Грузоподъемность</span>
                    <span className="font-semibold">{trailer.capacity || trailer.specs?.capacity || '-'} кг</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Тип подвески</span>
                    <span className="font-semibold">{suspensionType}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Тормозная система</span>
                    <span className="font-semibold">{brakesType}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Размеры кузова</span>
                    <span className="font-semibold">{trailer.dimensions || trailer.specs?.dimensions || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Габаритные размеры</span>
                    <span className="font-semibold">{trailer.gabarity || trailer.specs?.dimensions || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Колеса</span>
                    <span className="font-semibold">R13</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-100 pb-1">
                    <span className="text-gray-500">Покрытие рамы</span>
                    <span className="font-semibold">Горячее цинкование</span>
                  </div>
                  {trailer.boardHeight && (
                    <div className="flex justify-between border-b border-blue-100 pb-1">
                      <span className="text-gray-500">Высота борта</span>
                      <span className="font-semibold">{trailer.boardHeight} мм</span>
                    </div>
                  )}
                  {trailer.specs?.axles && (
                    <div className="flex justify-between border-b border-blue-100 pb-1">
                      <span className="text-gray-500">Количество осей</span>
                      <span className="font-semibold">{trailer.specs.axles}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Options List */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Дополнительные опции
              </h4>
              
              <div className="space-y-3">
                {compatibleAccessories.map(acc => (
                  <div 
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start
                      ${selectedAccessoryIds.includes(acc.id) 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center mr-4 mt-1 transition-colors
                      ${selectedAccessoryIds.includes(acc.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 bg-white'}
                    `}>
                      {selectedAccessoryIds.includes(acc.id) && <Check size={12} strokeWidth={3} />}
                    </div>

                    {acc.image && (
                      <div 
                        className="w-16 h-16 mr-4 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0 relative group/img cursor-zoom-in"
                        onMouseEnter={(e) => handleAccessoryMouseEnter(e, acc.image!)}
                        onMouseLeave={handleAccessoryMouseLeave}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(acc.image!);
                        }}
                      >
                        <img 
                          src={acc.image} 
                          alt={acc.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">{acc.name}</span>
                        <span className="font-bold text-blue-600 whitespace-nowrap ml-2">
                          {formatPrice(acc.price)} ₽
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{acc.description}</p>
                    </div>
                  </div>
                ))}

                {compatibleAccessories.length === 0 && (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    Нет доступных опций для этой модели
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
