import { Trailer, Order, Customer, Settings, Accessory, AdminUser, Warehouse } from '../../types';
import { VehicleModel, VehicleDatabase } from '../../features/vehicles/vehicleTypes';

// Типы для работы с остатками
export interface StockInfo {
  itemId: string;
  itemType: 'trailer' | 'option';
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
}

// Расширенный тип для матрицы остатков
export interface StockItem {
  id: string;
  trailerId?: string;
  optionId?: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  inTransit: number;
  available: number;
  minStock?: number;
  lastCountedAt?: string;
}

// Сводка остатков по товару
export interface StockSummary {
  productId: string;
  productType: 'trailer' | 'option';
  productName: string;
  productArticle?: string;
  productImage?: string;
  retailPrice?: number;
  category?: string;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  totalInTransit: number;
  byWarehouse: Record<string, {
    warehouseName: string;
    warehouseCity: string;
    quantity: number;
    reserved: number;
    available: number;
    inTransit: number;
  }>;
}

// Движение товара
export type MovementType = 'receipt' | 'shipment' | 'transfer' | 'adjustment';

export interface StockMovement {
  id: string;
  movementType: MovementType;
  trailerId?: string;
  optionId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  documentNumber?: string;
  reason?: string;
  leadId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

// Параметры фильтрации движений
export interface StockMovementFilters {
  movementType?: MovementType;
  warehouseId?: string;
  trailerId?: string;
  optionId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface StockReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  itemsReserved?: { itemId: string; itemType: string; quantity: number }[];
}

export interface IDatabaseProvider {
  // Users
  getUsers(): Promise<AdminUser[]>;
  getUser(id: string): Promise<AdminUser | null>;
  saveUser(user: AdminUser): Promise<AdminUser>;
  deleteUser(id: string): Promise<void>;

  // Trailers
  // getTrailers - для публичного сайта (только видимые прицепы с isVisible !== false)
  getTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]>;
  // getAllTrailers - для админки (все прицепы, включая скрытые)
  getAllTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]>;
  getTrailer(id: string): Promise<Trailer | null>;
  saveTrailer(trailer: Trailer): Promise<Trailer>;
  deleteTrailer(id: string): Promise<void>;
  
  // Accessories
  getAccessories(): Promise<Accessory[]>;
  getAccessory(id: string): Promise<Accessory | null>;
  saveAccessory(accessory: Accessory): Promise<Accessory>;
  deleteAccessory(id: string): Promise<void>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  createOrder(order: Order): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  saveCustomer(customer: Customer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Settings
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<Settings>;

  // Vehicles
  getVehicles(): Promise<VehicleModel[]>;
  searchVehicles(query: string): Promise<VehicleModel[]>;
  importVehicles(data: VehicleDatabase): Promise<void>;
  getVehiclesVersion(): Promise<number>;
  syncVehiclesFromCloud?(): Promise<void>;
  
  // Warehouses (склады)
  getWarehouses?(): Promise<Warehouse[]>;
  getWarehouse?(id: string): Promise<Warehouse | null>;
  saveWarehouse?(warehouse: Warehouse): Promise<Warehouse>;
  deleteWarehouse?(id: string): Promise<void>;
  
  // Stock Management (остатки) - базовые методы
  getStock?(itemId: string, itemType: 'trailer' | 'option'): Promise<StockInfo | null>;
  reserveStock?(orderId: string, items: { itemId: string; itemType: 'trailer' | 'option'; quantity: number }[]): Promise<StockReservationResult>;
  releaseStock?(orderId: string): Promise<{ success: boolean; error?: string }>;
  releaseStockItem?(itemId: string, itemType: 'trailer' | 'option', quantity: number): Promise<void>;
  commitStock?(orderId: string): Promise<{ success: boolean; error?: string }>;
  
  // Stock Management (расширенные методы)
  getStockSummary?(): Promise<StockSummary[]>;
  getStockItems?(warehouseId?: string): Promise<StockItem[]>;
  updateStockItem?(stockItemId: string, updates: Partial<StockItem>): Promise<StockItem>;
  setStockQuantity?(trailerId: string | null, optionId: string | null, warehouseId: string, quantity: number): Promise<void>;
  
  // Stock Movements (движения)
  getStockMovements?(filters?: StockMovementFilters): Promise<StockMovement[]>;
  createStockMovement?(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement>;
  
  // Initialization
  initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings, orders?: Order[]): Promise<void>;
}

