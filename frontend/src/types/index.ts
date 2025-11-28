export type UserRole = 'user' | 'manager' | 'admin';

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
    workHours: string;
    addresses: {
      region: 'ХМАО' | 'ЯНАО';
      city: string;
      address: string;
      coordinates?: [number, number];
    }[];
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
}

