import { IDatabaseProvider } from './interface';
import { Trailer, Order, Customer, Settings, Accessory } from '../../types';

const STORAGE_KEYS = {
  TRAILERS: 'onr_trailers',
  ACCESSORIES: 'onr_accessories',
  ORDERS: 'onr_orders',
  CUSTOMERS: 'onr_customers',
  SETTINGS: 'onr_settings',
  INITIALIZED: 'onr_initialized'
};

export class LocalStorageProvider implements IDatabaseProvider {
  
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Trailers ---

  async getTrailers(): Promise<Trailer[]> {
    return this.get<Trailer>(STORAGE_KEYS.TRAILERS);
  }

  async getTrailer(id: string): Promise<Trailer | null> {
    const trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    return trailers.find(t => t.id === id) || null;
  }

  async saveTrailer(trailer: Trailer): Promise<Trailer> {
    const trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    const index = trailers.findIndex(t => t.id === trailer.id);
    
    if (index >= 0) {
      trailers[index] = trailer;
    } else {
      trailers.push(trailer);
    }
    
    this.set(STORAGE_KEYS.TRAILERS, trailers);
    return trailer;
  }

  // --- Accessories ---

  async getAccessories(): Promise<Accessory[]> {
    return this.get<Accessory>(STORAGE_KEYS.ACCESSORIES);
  }

  // --- Orders ---

  async getOrders(): Promise<Order[]> {
    return this.get<Order>(STORAGE_KEYS.ORDERS);
  }

  async getOrder(id: string): Promise<Order | null> {
    const orders = this.get<Order>(STORAGE_KEYS.ORDERS);
    return orders.find(o => o.id === id) || null;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const orders = this.get<Order>(STORAGE_KEYS.ORDERS);
    return orders.find(o => o.orderNumber === orderNumber) || null;
  }

  async createOrder(order: Order): Promise<Order> {
    const orders = this.get<Order>(STORAGE_KEYS.ORDERS);
    orders.push(order);
    this.set(STORAGE_KEYS.ORDERS, orders);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const orders = this.get<Order>(STORAGE_KEYS.ORDERS);
    const index = orders.findIndex(o => o.id === id);
    
    if (index === -1) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    const updatedOrder = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
    orders[index] = updatedOrder;
    this.set(STORAGE_KEYS.ORDERS, orders);
    
    return updatedOrder;
  }

  // --- Customers ---

  async getCustomers(): Promise<Customer[]> {
    return this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
    return customers.find(c => c.id === id) || null;
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === customer.id);
    
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    
    this.set(STORAGE_KEYS.CUSTOMERS, customers);
    return customer;
  }

  // --- Settings ---

  async getSettings(): Promise<Settings | null> {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }

  // --- Init ---

  async initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings): Promise<void> {
    if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      return;
    }
    
    this.set(STORAGE_KEYS.TRAILERS, trailers);
    this.set(STORAGE_KEYS.ACCESSORIES, accessories);
    this.saveSettings(defaultSettings);
    
    // Пустые массивы для заказов и клиентов
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) this.set(STORAGE_KEYS.ORDERS, []);
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) this.set(STORAGE_KEYS.CUSTOMERS, []);
    
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('Database initialized with default data');
  }
}

