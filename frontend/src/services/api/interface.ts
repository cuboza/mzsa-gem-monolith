import { Trailer, Order, Customer, Settings, Accessory, AdminUser } from '../../types';

export interface IDatabaseProvider {
  // Users
  getUsers(): Promise<AdminUser[]>;
  getUser(id: string): Promise<AdminUser | null>;
  saveUser(user: AdminUser): Promise<AdminUser>;
  deleteUser(id: string): Promise<void>;

  // Trailers
  getTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]>;
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
  
  // Initialization
  initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings, orders?: Order[]): Promise<void>;
}

