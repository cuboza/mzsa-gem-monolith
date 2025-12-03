import { Trailer, Order, Customer, Settings, Accessory, AdminUser } from '../../types';
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
  
  // Stock Management (остатки)
  getStock?(itemId: string, itemType: 'trailer' | 'option'): Promise<StockInfo | null>;
  reserveStock?(orderId: string, items: { itemId: string; itemType: 'trailer' | 'option'; quantity: number }[]): Promise<StockReservationResult>;
  releaseStock?(orderId: string): Promise<{ success: boolean; error?: string }>;
  releaseStockItem?(itemId: string, itemType: 'trailer' | 'option', quantity: number): Promise<void>;
  commitStock?(orderId: string): Promise<{ success: boolean; error?: string }>;
  
  // Initialization
  initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings, orders?: Order[]): Promise<void>;
}

