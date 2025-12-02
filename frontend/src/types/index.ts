export type UserRole = 'user' | 'manager' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  password?: string; // В реальном приложении здесь должен быть хеш
  fullName: string;
  role: 'admin' | 'manager';
  isActive: boolean;
}

export interface Trailer {
  id: string;
  model: string; // "МЗСА 817700.002"
  name: string; // "Прицеп КОМПАКТ"
  category: 'general' | 'water' | 'commercial';
  price: number;
  capacity: number; // грузоподъемность, кг
  dimensions?: string; // "2050×1100×300" (ДxШxВ кузова)
  boardHeight?: number; // высота борта, мм
  bodyDimensions?: string; // для лодочных: макс. длина судна
  gabarity?: string; // габаритные размеры
  features: string[]; // особенности
  badge?: string; // "Хит продаж", "Новинка", "OFF-ROAD"
  isPopular?: boolean;
  isOnSale?: boolean; // Акция
  isPriceReduced?: boolean; // Снижена цена
  isNew?: boolean; // Новинка
  oldPrice?: number; // Старая цена (для скидки)
  availability: 'in_stock' | 'days_1_3' | 'days_7_14';
  image: string; // URL placeholder
  images?: string[]; // Array of all trailer images
  description?: string;
  
  specs?: {
    dimensions: string;
    capacity: string;
    weight: string;
    axles: number;
    boardHeight?: number;
    // Dynamic fields from scraper
    [key: string]: any;
  };

  suspension?: string;
  brakes?: string;

  // Для конфигуратора
  compatibility?: ('snowmobile' | 'boat' | 'atv' | 'motorcycle' | 'car' | 'cargo')[];
  maxVehicleLength?: number; // мм
  maxVehicleWidth?: number; // мм
  maxVehicleWeight?: number; // кг
  maxVehicleVolume?: number; // м³ - для грузовых прицепов
  
  // Складские данные
  stock?: number; // количество на складе
  
  // Метаданные
  createdAt?: string;
  updatedAt?: string;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  category: 'loading' | 'support' | 'spare' | 'cover' | 'safety' | 'guides' | 'boat_support';
  required?: boolean; // обязательный
  image: string;
  images?: string[];
  description: string;
  features?: string[];
  specs?: Record<string, unknown>;
  compatibility?: string[]; // ID прицепов или категории техники ("all", "general", "moto", "boat" etc) - API возвращает это поле
  compatibleWith?: string[]; // устаревшее название - для обратной совместимости
  stock?: string;
  isPopular?: boolean | null;
}

export interface Vehicle {
  brand: string;
  model: string;
  length: number; // мм
  width: number; // мм
  height: number; // мм
  weight: number; // кг
  volume?: number; // м³ - для грузов
  loadingAngle?: number; // угол погрузки
  tiePoints?: string; // тип точек крепления
}

export interface OrderEvent {
  id: string;
  timestamp: string;
  status: Order['status'];
  title: string;
  description?: string;
  user?: string; // кто изменил статус
}

export interface Order {
  id: string; // внутренний ID
  orderNumber: string; // отображаемый номер "ONR-20250106-0001"
  date: string; // ISO datetime
  status: 'new' | 'processing' | 'shipping' | 'ready' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  
  customer: {
    name: string;
    phone: string;
    email?: string;
    region: 'ХМАО' | 'ЯНАО';
    city: string;
    address?: string;
  };
  
  configuration: {
    trailer: Trailer;
    accessories: Accessory[];
    vehicle?: Vehicle; // если был конфигуратор
    totalPrice: number;
    discount?: number; // скидка в рублях
    manualPrice?: number; // ручная цена (если задана, игнорируется расчет)
  };
  
  delivery: {
    method: 'pickup' | 'delivery';
    region: 'ХМАО' | 'ЯНАО';
    city: string;
    address?: string;
    cost?: number;
  };
  
  timeline: OrderEvent[];
  
  notes?: string; // комментарии менеджера
  manager?: string; // ответственный
  
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  region: 'ХМАО' | 'ЯНАО';
  city: string;
  orders: string[]; // ID заказов
  totalSpent: number;
  createdAt: string;
  lastOrderAt?: string;
}

export interface Settings {
  contacts: {
    phone: string;
    email: string;
    orderEmail?: string; // Email для заявок
    workHours: string;
    addresses: {
      region: 'ХМАО' | 'ЯНАО';
      city: string;
      address: string;
      coordinates?: [number, number];
    }[];
  };
  
  social?: {
    whatsapp?: string;
    telegram?: string;
    vk?: string;
    youtube?: string;
  };

  seo?: {
    defaultTitle?: string;
    defaultDescription?: string;
    yandexMetrikaId?: string;
  };

  notifications?: {
    telegramChatId?: string;
    emailEnabled?: boolean;
  };
  
  delivery: {
    regions: {
      name: string;
      cities: string[];
      cost: number;
      days: string;
    }[];
  };
  
  about: {
    description: string;
    advantages: string[];
    certificates: string[];
  };
  
  // Hero-слайды на главной странице
  heroSlides?: HeroSlide[];
  
  // Магазины сети
  stores?: Store[];
  
  // Склады
  warehouses?: Warehouse[];
}

// ============================================================================
// HERO SLIDES - слайды карусели на главной странице
// ============================================================================

export interface HeroSlideFeature {
  icon: string; // Название иконки из lucide-react: 'Ruler', 'Anchor', 'Package', etc.
  text: string;
}

export interface HeroSlide {
  id: string;
  image: string; // URL изображения
  title: string; // Заголовок
  subtitle: string; // Подзаголовок (оранжевый)
  description: string; // Описание под заголовком
  features: HeroSlideFeature[]; // Фичи с иконками
  ctaText: string; // Текст кнопки CTA
  ctaLink: string; // Ссылка кнопки CTA ('/catalog', '/configurator', etc.)
  order: number; // Порядок отображения
  isActive: boolean; // Активен ли слайд
}

// ============================================================================
// STORES - Магазины сети
// ============================================================================

export interface Store {
  id: string;
  city: string; // Название города
  address: string; // Адрес магазина
  phone: string; // Основной телефон
  phone2?: string; // Дополнительный телефон
  email?: string; // Email магазина
  hours: string; // Часы работы
  mapLink: string; // Ссылка на Яндекс.Карты
  coordinates?: [number, number]; // [lat, lng] для карты
  region: 'ХМАО' | 'ЯНАО'; // Регион
  isMain?: boolean; // Главный магазин (показывается первым)
  isActive: boolean; // Активен ли магазин
  order: number; // Порядок отображения
}

// ============================================================================
// WAREHOUSES - Склады
// ============================================================================

export interface Warehouse {
  id: string;
  name: string; // Название склада
  city: string; // Город
  address: string; // Адрес
  phone?: string; // Телефон склада
  region: 'ХМАО' | 'ЯНАО';
  type: 'main' | 'regional' | 'partner'; // Тип склада
  isActive: boolean;
  order: number;
}

