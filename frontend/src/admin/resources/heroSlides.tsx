/**
 * Администрирование Hero-слайдов на главной странице
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Save, Trash2, GripVertical, Eye, EyeOff, 
  Image, Type, Link, ArrowUp, ArrowDown, X, Check 
} from 'lucide-react';
import { HeroSlide, HeroSlideFeature, Settings } from '../../types';
import { db } from '../../services/api';

// Доступные иконки для фич
const AVAILABLE_ICONS = [
  'Ruler', 'Anchor', 'Package', 'Truck', 'Shield', 'Award',
  'Settings', 'Wrench', 'CheckCircle', 'Star', 'Zap', 'Heart',
  'MapPin', 'Phone', 'Clock', 'Users', 'Box', 'Puzzle',
  'Layers', 'Lock', 'Gauge', 'Activity'
];

// Доступные изображения (из папки public/images/hero)
const AVAILABLE_IMAGES = [
  { value: '/images/hero/hero-freedom.png', label: 'Свобода (Горы)' },
  { value: '/images/hero/hero-comfort.jpg', label: 'Комфорт (Лес)' },
  { value: '/images/hero/hero-takeall.png', label: 'Возьми всё (Универсальный)' }
];

// Дефолтные слайды (те что сейчас в Home.tsx)
const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/images/hero/hero-freedom.png',
    title: 'Свобода не знает границ.',
    subtitle: 'Твой прицеп — тоже.',
    description: 'Бортовые прицепы от 1.8 до 4.6 м кузова • Лодочные от 3 до 9 м судна • Фургоны от 5 до 8 м³ объёма • Грузоподъёмность до 2.6 тонн',
    features: [
      { icon: 'Ruler', text: 'Кузов: 1853×1231 — 4587×1511 мм' },
      { icon: 'Anchor', text: 'Судно: 3000 — 9000 мм' },
      { icon: 'Package', text: 'Фургоны: 5 — 7.9 м³' }
    ],
    ctaText: 'Подобрать размер',
    ctaLink: '/configurator',
    order: 0,
    isActive: true
  },
  {
    id: 'slide-2',
    image: '/images/hero/hero-comfort.jpg',
    title: 'Не выбирай между уютом и приключениями.',
    subtitle: 'Бери всё сразу.',
    description: 'Тенты 15+ конфигураций и цветов • Дуги, стойки, каркасы • Лебёдки и ложементы для лодок • Крылья, борта, аппарели',
    features: [
      { icon: 'Settings', text: 'Тенты: плоские, высокие, каркасные' },
      { icon: 'Anchor', text: 'Лодочные: ролики, кильблоки, лебёдки' },
      { icon: 'Wrench', text: '136 аксессуаров в наличии' }
    ],
    ctaText: 'Выбрать опции',
    ctaLink: '/catalog',
    order: 1,
    isActive: true
  },
  {
    id: 'slide-3',
    image: '/images/hero/hero-takeall.png',
    title: 'Возьми всё.',
    subtitle: 'Один прицеп — тысяча возможностей.',
    description: 'Снегоход зимой, лодка летом, стройматериалы круглый год. Универсальные прицепы МЗСА адаптируются под любую задачу.',
    features: [
      { icon: 'Truck', text: 'Универсальные: мото, груз, техника' },
      { icon: 'Shield', text: 'Оцинковка: защита от коррозии' },
      { icon: 'Award', text: 'Гарантия 1 год от завода' }
    ],
    ctaText: 'Смотреть каталог',
    ctaLink: '/catalog',
    order: 2,
    isActive: true
  }
];

interface SlideEditorProps {
  slide: HeroSlide;
  onChange: (slide: HeroSlide) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SlideEditor = ({ 
  slide, 
  onChange, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}: SlideEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = <K extends keyof HeroSlide>(field: K, value: HeroSlide[K]) => {
    onChange({ ...slide, [field]: value });
  };

  const updateFeature = (index: number, feature: HeroSlideFeature) => {
    const newFeatures = [...slide.features];
    newFeatures[index] = feature;
    updateField('features', newFeatures);
  };

  const addFeature = () => {
    updateField('features', [...slide.features, { icon: 'Star', text: 'Новая особенность' }]);
  };

  const removeFeature = (index: number) => {
    updateField('features', slide.features.filter((_, i) => i !== index));
  };

  return (
    <div className={`border rounded-lg ${slide.isActive ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
      {/* Заголовок слайда */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <GripVertical className="text-gray-400 cursor-grab" size={20} />
        
        {/* Превью изображения */}
        <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
          {slide.image && (
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{slide.title || 'Без названия'}</h3>
          <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Статус */}
          <button
            onClick={(e) => { e.stopPropagation(); updateField('isActive', !slide.isActive); }}
            className={`p-1.5 rounded ${slide.isActive ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-100'}`}
            title={slide.isActive ? 'Активен' : 'Скрыт'}
          >
            {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {/* Перемещение */}
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowUp size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <ArrowDown size={18} />
          </button>

          {/* Удалить */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Развёрнутый редактор */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {/* Изображение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Image size={14} className="inline mr-1" />
              Изображение
            </label>
            
            <div className="space-y-2">
              <select
                value={AVAILABLE_IMAGES.some(img => img.value === slide.image) ? slide.image : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    updateField('image', e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">Свой URL...</option>
                {AVAILABLE_IMAGES.map(img => (
                  <option key={img.value} value={img.value}>{img.label}</option>
                ))}
              </select>

              <input
                type="text"
                value={slide.image}
                onChange={(e) => updateField('image', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="/images/hero/hero-example.jpg"
              />
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Рекомендуемый размер: 1920×1080px. Форматы: JPG, PNG, WebP
            </p>
          </div>

          {/* Заголовок и подзаголовок */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Type size={14} className="inline mr-1" />
                Заголовок
              </label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Свобода не знает границ."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подзаголовок (оранжевый)
              </label>
              <input
                type="text"
                value={slide.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Твой прицеп — тоже."
              />
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={slide.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Бортовые прицепы от 1.8 до 4.6 м кузова..."
            />
          </div>

          {/* Особенности (features) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Особенности (макс. 3)
            </label>
            <div className="space-y-2">
              {slide.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={feature.icon}
                    onChange={(e) => updateFeature(idx, { ...feature, icon: e.target.value })}
                    className="w-32 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {AVAILABLE_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={feature.text}
                    onChange={(e) => updateFeature(idx, { ...feature, text: e.target.value })}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Описание особенности"
                  />
                  <button
                    onClick={() => removeFeature(idx)}
                    className="p-2 text-red-400 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {slide.features.length < 3 && (
                <button
                  onClick={addFeature}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={16} /> Добавить особенность
                </button>
              )}
            </div>
          </div>

          {/* CTA кнопка */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст кнопки
              </label>
              <input
                type="text"
                value={slide.ctaText}
                onChange={(e) => updateField('ctaText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Смотреть каталог"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Link size={14} className="inline mr-1" />
                Ссылка кнопки
              </label>
              <select
                value={slide.ctaLink}
                onChange={(e) => updateField('ctaLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="/catalog">Каталог (/catalog)</option>
                <option value="/configurator">Конфигуратор (/configurator)</option>
                <option value="/catalog?cat=general">Универсальные прицепы</option>
                <option value="/catalog?cat=water">Лодочные прицепы</option>
                <option value="/catalog?cat=commercial">Коммерческие прицепы</option>
                <option value="/contacts">Контакты (/contacts)</option>
                <option value="/about">О компании (/about)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================================

export const HeroSlidesAdmin = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Загрузка слайдов
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const settings = await db.getSettings();
        if (settings?.heroSlides && settings.heroSlides.length > 0) {
          setSlides(settings.heroSlides.sort((a, b) => a.order - b.order));
        } else {
          // Используем дефолтные слайды
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        console.error('Error loading hero slides:', err);
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    loadSlides();
  }, []);

  // Сохранение
  const saveSlides = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settings = await db.getSettings();
      if (settings) {
        await db.saveSettings({
          ...settings,
          heroSlides: slides.map((s, idx) => ({ ...s, order: idx }))
        });
        setHasChanges(false);
        setMessage({ type: 'success', text: 'Слайды успешно сохранены!' });
      }
    } catch (err) {
      console.error('Error saving slides:', err);
      setMessage({ type: 'error', text: 'Ошибка сохранения. Попробуйте ещё раз.' });
    } finally {
      setSaving(false);
    }
  }, [slides]);

  const updateSlide = (index: number, slide: HeroSlide) => {
    const newSlides = [...slides];
    newSlides[index] = slide;
    setSlides(newSlides);
    setHasChanges(true);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      setMessage({ type: 'error', text: 'Нельзя удалить последний слайд' });
      return;
    }
    setSlides(slides.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides);
    setHasChanges(true);
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      image: '/images/hero/hero-freedom.png',
      title: 'Новый слайд',
      subtitle: 'Подзаголовок',
      description: 'Описание слайда',
      features: [{ icon: 'Star', text: 'Особенность' }],
      ctaText: 'Подробнее',
      ctaLink: '/catalog',
      order: slides.length,
      isActive: false
    };
    setSlides([...slides, newSlide]);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (window.confirm('Сбросить все слайды к значениям по умолчанию?')) {
      setSlides(DEFAULT_SLIDES);
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero-карусель</h1>
          <p className="text-gray-500 text-sm mt-1">
            Управление слайдами на главной странице сайта
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Сбросить
          </button>
          <button
            onClick={saveSlides}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save size={18} />
            )}
            Сохранить
          </button>
        </div>
      </div>

      {/* Сообщение */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {message.text}
          <button 
            onClick={() => setMessage(null)} 
            className="ml-auto hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Список слайдов */}
      <div className="space-y-3 mb-4">
        {slides.map((slide, index) => (
          <SlideEditor
            key={slide.id}
            slide={slide}
            onChange={(s) => updateSlide(index, s)}
            onDelete={() => deleteSlide(index)}
            onMoveUp={() => moveSlide(index, 'up')}
            onMoveDown={() => moveSlide(index, 'down')}
            isFirst={index === 0}
            isLast={index === slides.length - 1}
          />
        ))}
      </div>

      {/* Добавить слайд */}
      <button
        onClick={addSlide}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Добавить слайд
      </button>

      {/* Подсказка */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">💡 Советы</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Рекомендуется использовать 2-4 слайда для оптимальной работы</li>
          <li>• Изображения должны быть оптимизированы (WebP, сжатие)</li>
          <li>• Первый активный слайд будет предзагружен для быстрого LCP</li>
          <li>• Неактивные слайды не отображаются на сайте</li>
        </ul>
      </div>
    </div>
  );
};

export default HeroSlidesAdmin;
