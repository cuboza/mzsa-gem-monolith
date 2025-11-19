import { Trailer, Order, Customer, Settings, Accessory } from '../../types';

export interface IDatabaseProvider {
  // Trailers
  getTrailers(): Promise<Trailer[]>;
  getTrailer(id: string): Promise<Trailer | null>;
  saveTrailer(trailer: Trailer): Promise<Trailer>;
  
  // Accessories
  getAccessories(): Promise<Accessory[]>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  createOrder(order: Order): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  saveCustomer(customer: Customer): Promise<Customer>;
  
  // Settings
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<Settings>;
  
  // Initialization
  initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings): Promise<void>;
}

