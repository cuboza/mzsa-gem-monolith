import { useState, useMemo, useEffect } from 'react';
import { Trailer, Accessory } from '../types';
import type { LucideIcon } from 'lucide-react';
import { X, Check, ShoppingCart, Ruler, Weight, Shield, Activity, CircleOff, ChevronLeft, ChevronRight, Maximize2, ArrowUpDown, Gauge, CircleDot, Anchor, MoveRight, MoveHorizontal } from 'lucide-react';
import { accessories } from '../data/accessories';
import { useNavigate } from 'react-router-dom';
import { ResponsiveSticky } from './layout/ResponsiveSticky';
import { formatPrice } from '../utils';

const formatNumberValue = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

interface TrailerDetailsModalProps {
  trailer: Trailer;
  onClose: () => void;
}

export const TrailerDetailsModal = ({ trailer, onClose }: TrailerDetailsModalProps) => {
  const navigate = useNavigate();
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hoveredAccessoryImage, setHoveredAccessoryImage] = useState<{url: string, x: number, y: number} | null>(null);
  const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();
  const fallbackDescription = "Надежный и универсальный прицеп для различных задач. Полностью оцинкованная рама методом горячего цинкования обеспечивает защиту от коррозии на долгие годы.";
  type SpecConfig = {
    label: string;
    icon: LucideIcon;
    section?: 'summary' | 'detailed';
    suffix?: string;
    format?: (value: unknown) => string;
    order?: number;
  };
  type SpecEntry = {
    key: string;
    label: string;
    icon: LucideIcon;
    value: string;
    section: 'summary' | 'detailed';
    order: number;
  };

  const specDefinitions: Record<string, SpecConfig> = {
    bodyDimensions: {
      label: 'Длина судна',
      icon: Anchor,
      section: 'summary',
      order: 0,
      format: (value) => {
        const normalized = normalizeWhitespace(String(value));
        return normalized.replace(/мм\s*мм/g, 'мм');
      }
    },
    dimensions: { label: 'Размеры кузова', icon: Ruler, section: 'summary', order: 10 },
    capacity: { label: 'Грузоподъемность', icon: Weight, section: 'summary', order: 20 },
    gabarity: { label: 'Габариты', icon: Maximize2, section: 'summary', order: 30 },
    suspension: { label: 'Подвеска', icon: Activity, section: 'summary', order: 40 },
    brakes: { label: 'Тормоза', icon: CircleOff, section: 'summary', order: 50 },
    boardHeight: { label: 'Высота борта', icon: ArrowUpDown, suffix: ' мм', order: 60 },
    weight: { label: 'Собственный вес', icon: Gauge, section: 'summary', order: 70 },
    axles: { label: 'Количество осей', icon: CircleDot, section: 'summary', order: 80 },
    maxVehicleLength: { label: 'Макс. длина техники', icon: MoveRight, suffix: ' мм', order: 90 },
    maxVehicleWidth: { label: 'Макс. ширина техники', icon: MoveHorizontal, suffix: ' мм', order: 100 },
    maxVehicleWeight: { label: 'Макс. вес техники', icon: Gauge, suffix: ' кг', order: 110 },
    
    // Extended specs from scraper
    polnaya_massa: { label: 'Полная масса', icon: Weight, suffix: ' кг', order: 21 },
    snaryazhyonnaya_massa: { label: 'Снаряжённая масса', icon: Gauge, suffix: ' кг', order: 70 }, // Override weight
    pogruzochnaya_vysota: { label: 'Погрузочная высота', icon: ArrowUpDown, suffix: ' мм', order: 61 },
    kol_vo_listov_ressory: { label: 'Количество листов рессоры', icon: Activity, order: 41 },
    nagruzka_na_odnu_os: { label: 'Нагрузка на одну ось', icon: Weight, suffix: ' кг', order: 81 },
    dorozhnyy_prosvet: { label: 'Дорожный просвет', icon: ArrowUpDown, suffix: ' мм', order: 62 },
    koleya_koles: { label: 'Колея колёс', icon: MoveHorizontal, suffix: ' мм', order: 31 },
    razmer_kolyos: { label: 'Размер колёс', icon: CircleDot, order: 82 },
    stsepnoe_ustroystvo: { label: 'Сцепное устройство', icon: Anchor, order: 120 },
    tip_tsu: { label: 'Тип ТСУ', icon: Anchor, order: 121 },
    fonari: { label: 'Фонари', icon: Activity, order: 130 },
    shteker: { label: 'Штекер', icon: Activity, order: 131 },
    petli_krepleniya_gruza: { label: 'Петли крепления груза', icon: Anchor, order: 140 },
    zashchitnoe_pokrytie: { label: 'Защитное покрытие', icon: Shield, order: 150 }
  };

  const { descriptionBullets, descriptionParagraphs } = useMemo(() => {
    const raw = trailer.description && trailer.description.trim().length ? trailer.description : fallbackDescription;
    const normalized = raw.replace(/\r\n/g, '\n').trim();

    const bulletParts = normalized
      .split(/●/)
      .map(part => normalizeWhitespace(part.replace(/\n+/g, ' ')))
      .filter(Boolean);

    if (bulletParts.length > 1) {
      return { descriptionBullets: bulletParts, descriptionParagraphs: [] as string[] };
    }

    const paragraphs = normalized
      .split(/\n{2,}/)
      .map(block => normalizeWhitespace(block.replace(/\n/g, ' ')))
      .filter(Boolean);

    return { descriptionBullets: [] as string[], descriptionParagraphs: paragraphs };
  }, [trailer.description]);

  const suspensionType = trailer.suspension || 'Рессорная';
  const brakesType = trailer.brakes || 'Нет';
  const formattedFeatures = useMemo(() => {
    return (trailer.features || [])
      .map(feature => typeof feature === 'string' ? normalizeWhitespace(feature) : '')
      .filter(Boolean);
  }, [trailer.features]);
  const specEntries = useMemo<SpecEntry[]>(() => {
    const entries: SpecEntry[] = [];
    const addSpec = (key: keyof typeof specDefinitions, rawValue: unknown) => {
      if (rawValue === null || rawValue === undefined || rawValue === '') return;
      const definition = specDefinitions[key];
      if (!definition) return;
      let valueText: string;
      if (definition.format) {
        valueText = definition.format(rawValue);
      } else if (typeof rawValue === 'number') {
        valueText = `${formatNumberValue(rawValue)}${definition.suffix ?? ''}`;
      } else {
        valueText = String(rawValue);
      }
      entries.push({
        key,
        label: definition.label,
        icon: definition.icon,
        value: valueText,
        section: definition.section ?? 'detailed',
        order: definition.order ?? 100,
      });
    };

    addSpec('dimensions', trailer.dimensions || trailer.specs?.dimensions);
    addSpec('capacity', trailer.specs?.capacity || (trailer.capacity ? `${formatNumberValue(trailer.capacity)} кг` : undefined));
    addSpec('gabarity', trailer.gabarity);
    addSpec('suspension', suspensionType);
    addSpec('brakes', brakesType);
    addSpec('boardHeight', trailer.boardHeight ?? trailer.specs?.boardHeight);
    addSpec('weight', trailer.specs?.weight);
    addSpec('axles', trailer.specs?.axles);
    addSpec('bodyDimensions', trailer.bodyDimensions);
    
    if (['water'].includes(trailer.category)) {
      addSpec('maxVehicleLength', trailer.maxVehicleLength);
      addSpec('maxVehicleWidth', trailer.maxVehicleWidth);
      addSpec('maxVehicleWeight', trailer.maxVehicleWeight);
    }

    // Add dynamic specs from scraper
    if (trailer.specs) {
      Object.keys(trailer.specs).forEach(key => {
        // Skip keys that are already handled or not in definitions
        if (['dimensions', 'capacity', 'weight', 'axles', 'boardHeight'].includes(key)) return;
        if (key in specDefinitions) {
          addSpec(key, trailer.specs![key]);
        }
      });
    }

    return entries.sort((a, b) => a.order - b.order);
  }, [trailer, suspensionType, brakesType]);
  const summarySpecs = specEntries.filter(entry => entry.section === 'summary');
  const detailedSpecs = specEntries.filter(entry => entry.section !== 'summary');

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const allImages = useMemo(() => {
    // Собираем все изображения и убираем дубликаты
    const images: string[] = [];
    
    // Добавляем главное изображение первым
    if (trailer.image) {
      images.push(trailer.image);
    }
    
    // Добавляем остальные изображения, если они не дубликаты
    if (trailer.images && trailer.images.length > 0) {
      trailer.images.forEach(img => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Если ничего нет, возвращаем плейсхолдер
    return images.length > 0 ? images : [`https://placehold.co/600x400?text=${encodeURIComponent(trailer.model)}`];
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
      // Объединяем compatibleWith (из данных) и compatibility (из API) 
      const accCompat = acc.compatibleWith || acc.compatibility || [];
      // Если пустой массив - значит специфичная опция, не показываем всем
      if (accCompat.length === 0) return false;
      // 'all' = универсальная опция
      if (accCompat.includes('all')) return true;
      // Прямое совпадение по ID прицепа
      if (accCompat.includes(trailer.id)) return true;
      // Совпадение по категории прицепа
      if (accCompat.includes(trailer.category)) return true;
      // Совпадение по тегам совместимости прицепа
      if (trailer.compatibility) {
        return trailer.compatibility.some(c => accCompat.includes(c));
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

  // Используем formatPrice из utils/

  const handleOrder = () => {
    // Navigate to configurator step 4 (Details) with pre-selected trailer and accessories
    navigate('/configurator', { 
      state: { 
        trailer, 
        initialAccessories: selectedAccessoryIds,
        skipToStep: 4 // Сразу на этап "Детали"
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
            alt="Полный вид" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Accessory Hover Preview */}
      {hoveredAccessoryImage && (
        <div 
          className="fixed z-[70] pointer-events-none bg-white dark:bg-gray-800 p-2 rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            left: Math.min(hoveredAccessoryImage.x, window.innerWidth - 320), 
            top: Math.min(hoveredAccessoryImage.y, window.innerHeight - 320),
            width: '300px',
            height: '300px'
          }}
        >
          <img 
            src={hoveredAccessoryImage.url} 
            alt="Предпросмотр" 
            className="w-full h-full object-contain rounded-lg bg-gray-50 dark:bg-gray-900"
          />
        </div>
      )}

      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Left Column: Image & Key Info */}
        <ResponsiveSticky 
          stickyAt="md" 
          offsetClass="top-0" 
          maxHeight="calc(90vh - 32px)" 
          className="w-full md:w-5/12 bg-gray-50 dark:bg-gray-900 flex flex-col border-r border-gray-100 dark:border-gray-700 shrink-0"
        >
          <div className="relative h-64 md:h-80 bg-white dark:bg-gray-800 shrink-0 group cursor-zoom-in" onClick={() => setLightboxImage(allImages[currentImageIndex])}>
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
              <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                {trailer.badge}
              </div>
            )}
          </div>

          <div className="p-6 flex-grow md:overflow-y-auto md:custom-scrollbar">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{trailer.model}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{trailer.name}</p>

            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                {summarySpecs.length ? summarySpecs.map(spec => {
                  const Icon = spec.icon;
                  return (
                    <div key={spec.key} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Icon className="w-4 h-4 text-blue-500" />
                        <span>{spec.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{spec.value}</span>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500">Характеристики не указаны.</p>
                )}
              </div>

              <div className="mt-2 space-y-4">
                {detailedSpecs.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    {detailedSpecs.map(spec => {
                      const Icon = spec.icon;
                      return (
                        <div key={spec.key} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Icon className="w-4 h-4 text-blue-500" />
                            <span>{spec.label}</span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">{spec.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                    <h5 className="font-bold text-gray-900 dark:text-white mb-2">Особенности модели:</h5>
                    {formattedFeatures.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {formattedFeatures.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Характеристики уточняются.</p>
                    )}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-6 border-t border-gray-100 dark:border-gray-700 pt-6">
               <h3 className="font-bold text-gray-900 dark:text-white mb-2">Описание</h3>
               <div className={`text-sm text-gray-600 dark:text-gray-300 relative ${!showFullDescription ? 'max-h-36 overflow-hidden' : ''}`}>
                 {descriptionBullets.length > 0 ? (
                   <ul className="space-y-3 pl-1">
                     {descriptionBullets.map((item, idx) => (
                       <li key={idx} className="flex gap-2">
                         <span className="text-blue-500 mt-1">•</span>
                         <p className="leading-relaxed text-gray-700 dark:text-gray-300">{item}</p>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   descriptionParagraphs.map((paragraph, idx) => (
                     <p key={idx} className="mb-3 last:mb-0 leading-relaxed">
                       {paragraph}
                     </p>
                   ))
                 )}
                 {!showFullDescription && (
                   <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                 )}
               </div>
               <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 text-sm font-semibold hover:underline mt-2"
                >
                  {showFullDescription ? 'Свернуть' : 'Читать полностью'}
               </button>
            </div>
          </div>

          {/* Sticky Footer for Price & Order */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shrink-0 z-10">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              {trailer.price > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Прицеп:</span>
                    <span>{formatPrice(trailer.price || 0)} ₽</span>
                  </div>
                  {optionsPrice > 0 && (
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>Опции:</span>
                      <span>+ {formatPrice(optionsPrice)} ₽</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between items-end">
                    <span className="font-bold text-gray-900 dark:text-white">Итого:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(totalPrice || 0)} ₽</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <span className="text-xl font-bold text-gray-700 dark:text-gray-300">Цена по запросу</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Позвоните нам для уточнения</p>
                </div>
              )}
              
              <button 
                onClick={handleOrder}
                className="w-full mt-4 bg-orange-600 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md transition-all transform active:scale-95 flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Заказать
              </button>
            </div>
          </div>
        </ResponsiveSticky>

        {/* Right Column: Details & Options */}
        <div className="w-full md:w-7/12 flex flex-col h-full md:max-h-none">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Опции
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors hidden md:block"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col flex-grow min-h-0">
            <div className="overflow-y-auto flex-grow custom-scrollbar">
              <div className="px-6 pb-6 space-y-3">
                {compatibleAccessories.map(acc => (
                  <div 
                    key={acc.id}
                    onClick={() => toggleAccessory(acc.id)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start
                      ${selectedAccessoryIds.includes(acc.id) 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30' 
                        : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center mr-4 mt-1 transition-colors
                      ${selectedAccessoryIds.includes(acc.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}
                    `}>
                      {selectedAccessoryIds.includes(acc.id) && <Check size={12} strokeWidth={3} />}
                    </div>

                    {acc.image && (
                      <div 
                        className="w-16 h-16 mr-4 rounded-lg overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-shrink-0 relative group/img cursor-zoom-in"
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
                        <span className="font-semibold text-gray-900 dark:text-white">{acc.name}</span>
                        <span className="font-bold text-blue-600 whitespace-nowrap ml-2">
                          {formatPrice(acc.price)} ₽
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{acc.description}</p>
                    </div>
                  </div>
                ))}

                {compatibleAccessories.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700">
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
