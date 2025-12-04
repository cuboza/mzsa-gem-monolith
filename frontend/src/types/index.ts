import type { WarehouseStock } from '../features/stock';

export type UserRole = 'user' | 'manager' | 'admin';

// ========== СИСТЕМА ПРАВ ДОСТУПА ==========

/** Модули системы (ресурсы) */
export type PermissionResource = 
  | 'orders'       // Заказы
  | 'trailers'     // Прицепы
  | 'accessories'  // Аксессуары
  | 'customers'    // Клиенты
  | 'users'        // Пользователи
  | 'settings'     // Настройки
  | 'warehouses'   // Склады
  | 'stock'        // Остатки
  | 'hero-slides'  // Слайды на главной
  | 'stores'       // Магазины
  | 'import-1c';   // Импорт 1С

/** Операции над ресурсами */
export type PermissionOperation = 'view' | 'create' | 'edit' | 'delete' | 'export';

/** Права доступа на один ресурс */
export interface ResourcePermission {
  resource: PermissionResource;
  operations: PermissionOperation[];
}

/** Метаданные модуля для UI */
export interface PermissionModuleMeta {
  resource: PermissionResource;
  label: string;
  description: string;
  operations: {
    operation: PermissionOperation;
    label: string;
    description: string;
  }[];
}

/** Объект прав доступа (хранится как JSON в БД) */
export type UserPermissions = Record<PermissionResource, PermissionOperation[]>;

/** Права по умолчанию для ролей */
export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  orders: ['view', 'create', 'edit', 'delete', 'export'],
  trailers: ['view', 'create', 'edit', 'delete', 'export'],
  accessories: ['view', 'create', 'edit', 'delete', 'export'],
  customers: ['view', 'create', 'edit', 'delete', 'export'],
  users: ['view', 'create', 'edit', 'delete'],
  settings: ['view', 'edit'],
  warehouses: ['view', 'create', 'edit', 'delete'],
  stock: ['view', 'create', 'edit', 'delete', 'export'],
  'hero-slides': ['view', 'create', 'edit', 'delete'],
  stores: ['view', 'create', 'edit', 'delete'],
  'import-1c': ['view', 'create'],
};

export const DEFAULT_MANAGER_PERMISSIONS: UserPermissions = {
  orders: ['view', 'create', 'edit', 'export'],
  trailers: ['view', 'export'],
  accessories: ['view', 'export'],
  customers: ['view', 'create', 'edit', 'export'],
  users: [],
  settings: ['view'],
  warehouses: ['view'],
  stock: ['view', 'export'],
  'hero-slides': ['view'],
  stores: ['view'],
  'import-1c': [],
};

/** Конфигурация всех модулей для UI настройки прав */
export const PERMISSION_MODULES: PermissionModuleMeta[] = [
  {
    resource: 'orders',
    label: 'Заказы',
    description: 'Управление заказами покупателей',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр списка и деталей заказов' },
      { operation: 'create', label: 'Создание', description: 'Создание новых заказов' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение статуса и данных заказов' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление заказов' },
      { operation: 'export', label: 'Экспорт', description: 'Выгрузка заказов в Excel/CSV' },
    ],
  },
  {
    resource: 'trailers',
    label: 'Прицепы',
    description: 'Управление каталогом прицепов',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр каталога прицепов' },
      { operation: 'create', label: 'Создание', description: 'Добавление новых прицепов' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение характеристик и цен' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление прицепов из каталога' },
      { operation: 'export', label: 'Экспорт', description: 'Выгрузка каталога' },
    ],
  },
  {
    resource: 'accessories',
    label: 'Аксессуары',
    description: 'Управление дополнительными товарами',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр аксессуаров' },
      { operation: 'create', label: 'Создание', description: 'Добавление аксессуаров' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение аксессуаров' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление аксессуаров' },
      { operation: 'export', label: 'Экспорт', description: 'Выгрузка аксессуаров' },
    ],
  },
  {
    resource: 'customers',
    label: 'Клиенты',
    description: 'Управление базой клиентов',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр списка клиентов' },
      { operation: 'create', label: 'Создание', description: 'Добавление новых клиентов' },
      { operation: 'edit', label: 'Редактирование', description: 'Редактирование данных клиентов' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление клиентов' },
      { operation: 'export', label: 'Экспорт', description: 'Выгрузка базы клиентов' },
    ],
  },
  {
    resource: 'users',
    label: 'Пользователи',
    description: 'Управление администраторами и менеджерами',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр списка пользователей' },
      { operation: 'create', label: 'Создание', description: 'Добавление новых пользователей' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение прав и данных' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление пользователей' },
    ],
  },
  {
    resource: 'warehouses',
    label: 'Склады',
    description: 'Управление складами',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр списка складов' },
      { operation: 'create', label: 'Создание', description: 'Добавление новых складов' },
      { operation: 'edit', label: 'Редактирование', description: 'Редактирование складов' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление складов' },
    ],
  },
  {
    resource: 'stock',
    label: 'Остатки',
    description: 'Управление остатками товаров',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр остатков' },
      { operation: 'create', label: 'Приход', description: 'Оприходование товаров' },
      { operation: 'edit', label: 'Корректировка', description: 'Изменение остатков' },
      { operation: 'delete', label: 'Списание', description: 'Списание товаров' },
      { operation: 'export', label: 'Экспорт', description: 'Выгрузка отчетов' },
    ],
  },
  {
    resource: 'settings',
    label: 'Настройки',
    description: 'Системные настройки',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр настроек' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение настроек' },
    ],
  },
  {
    resource: 'hero-slides',
    label: 'Слайды главной',
    description: 'Управление каруселью на главной',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр слайдов' },
      { operation: 'create', label: 'Создание', description: 'Добавление слайдов' },
      { operation: 'edit', label: 'Редактирование', description: 'Изменение слайдов' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление слайдов' },
    ],
  },
  {
    resource: 'stores',
    label: 'Магазины',
    description: 'Управление филиалами',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр магазинов' },
      { operation: 'create', label: 'Создание', description: 'Добавление магазинов' },
      { operation: 'edit', label: 'Редактирование', description: 'Редактирование магазинов' },
      { operation: 'delete', label: 'Удаление', description: 'Удаление магазинов' },
    ],
  },
  {
    resource: 'import-1c',
    label: 'Импорт 1С',
    description: 'Загрузка данных из 1С',
    operations: [
      { operation: 'view', label: 'Просмотр', description: 'Просмотр истории импортов' },
      { operation: 'create', label: 'Импорт', description: 'Запуск импорта данных' },
    ],
  },
];

// ========== ПОЛЬЗОВАТЕЛИ ==========

export interface AdminUser {
  id: string;
  username: string;
  password?: string; // В реальном приложении здесь должен быть хеш
  fullName: string;
  role: 'admin' | 'manager';
  isActive: boolean;
  /** Индивидуальные права доступа (переопределяют права роли) */
  permissions?: UserPermissions;
}

export interface Trailer {
  id: string;
  article?: string; // Артикул производителя (МЗСА)
  onr_article?: string; // Артикул ОНР (внутренний)
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
  stock?: number; // количество на складе (deprecated: используйте warehouses)
  warehouses?: WarehouseStock[]; // Многоскладская модель остатков
  
  // Видимость
  isVisible?: boolean; // видимость в каталоге и конфигураторе (по умолчанию true)
  
  // Метаданные
  createdAt?: string;
  updatedAt?: string;
}

export interface Accessory {
  id: string;
  article?: string; // Артикул производителя
  onr_article?: string; // Артикул ОНР (внутренний, сквозной)
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
  onr_article?: string; // Артикул ОНР (внутренний, сквозной)
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
  
  // Настройки отображения остатков
  stock?: {
    displayMode: 'by_city' | 'total' | 'hidden';  // Режим отображения
    showQuantity: boolean;     // Показывать количество
    localDeliveryDays: string; // Срок доставки из другого города
    orderDeliveryDays: string; // Срок поставки под заказ
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

export type PriceListType = 'retail' | 'wholesale' | 'dealer' | 'special';

export interface Warehouse {
  id: string;
  name: string; // Название склада
  code?: string; // Код склада (для интеграции с 1С)
  city: string; // Город
  address: string; // Адрес
  phone?: string; // Телефон склада
  email?: string; // Email склада
  region: 'ХМАО' | 'ЯНАО';
  type: 'main' | 'regional' | 'partner'; // Тип склада
  priceList: PriceListType; // Тип цен для этого склада
  priority: number; // Приоритет при выборе склада (меньше = выше приоритет)
  description?: string; // Описание склада
  isActive: boolean;
  order: number;
  // Настройки отгрузки
  canShip?: boolean; // Может ли отгружать товар
  workingHours?: string; // Часы работы
  // Метаданные
  createdAt?: string;
  updatedAt?: string;
}

