import { IDatabaseProvider } from './interface';
import { Trailer, Order, Customer, Settings, Accessory, AdminUser } from '../../types';
import { VehicleModel, VehicleDatabase } from '../../features/vehicles/vehicleTypes';
import { searchVehicles } from '../../features/vehicles/vehicleSearch';
import defaultVehiclesDb from '../../data/vehiclesDatabase.json';

const STORAGE_KEYS = {
  TRAILERS: 'onr_trailers',
  ACCESSORIES: 'onr_accessories',
  ORDERS: 'onr_orders',
  CUSTOMERS: 'onr_customers',
  SETTINGS: 'onr_settings',
  USERS: 'onr_users',
  INITIALIZED: 'onr_initialized'
};

// --- Search Helpers ---

function parseTrailerDimensions(dimStr?: string): { length: number, width: number } | null {
  if (!dimStr) return null;
  // Matches "2050×1100" or "2050x1100"
  const parts = dimStr.split(/[xх×*]/).map(s => parseInt(s.trim(), 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { length: parts[0], width: parts[1] };
  }
  return null;
}

function parseSearchQuery(query: string) {
  const q = query.toLowerCase();
  
  // 1. Dimensions: "3x2", "3*2", "3000x2000"
  const dimRegex = /(\d+(?:[.,]\d+)?)\s*[xх×*]\s*(\d+(?:[.,]\d+)?)/;
  const dimMatch = q.match(dimRegex);
  
  let targetDims = null;
  if (dimMatch) {
    let l = parseFloat(dimMatch[1].replace(',', '.'));
    let w = parseFloat(dimMatch[2].replace(',', '.'));
    // Convert meters to mm if small
    if (l < 10) l *= 1000;
    if (w < 10) w *= 1000;
    targetDims = { length: l, width: w };
  }

  // 2. Vehicle Type & Length
  const vehicleTypes = [
    { keys: ['лодка', 'катер', 'лодки', 'катера'], type: 'boat' },
    { keys: ['снегоход', 'снегохода'], type: 'snowmobile' },
    { keys: ['квадроцикл', 'atv'], type: 'atv' },
    { keys: ['мотоцикл', 'мото'], type: 'motorcycle' }
  ];

  const foundType = vehicleTypes.find(vt => vt.keys.some(k => q.includes(k)));
  
  let targetLength = null;
  if (foundType) {
    // Look for length like "3.5м", "3.5 м"
    const lenRegex = /(\d+(?:[.,]\d+)?)\s*м/;
    const lenMatch = q.match(lenRegex);
    if (lenMatch) {
      let l = parseFloat(lenMatch[1].replace(',', '.'));
      if (l < 20) l *= 1000; // meters to mm
      targetLength = l;
    }
  }

  return {
    raw: q,
    targetDims,
    vehicleType: foundType?.type,
    targetLength
  };
}

export class LocalStorageProvider implements IDatabaseProvider {
  
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Trailers ---

  /**
   * Генерирует массив compatibility на основе категории прицепа
   * (аналогично supabaseProvider)
   */
  private addCompatibility(trailer: Trailer): Trailer {
    if (trailer.compatibility && trailer.compatibility.length > 0) {
      return trailer;
    }
    
    let compatibility: Trailer['compatibility'];
    switch (trailer.category) {
      case 'water':
        compatibility = ['boat'];
        break;
      case 'commercial':
        compatibility = ['cargo', 'car', 'snowmobile', 'atv'];
        break;
      case 'general':
      default:
        compatibility = ['snowmobile', 'atv', 'motorcycle'];
        break;
    }
    
    return { ...trailer, compatibility };
  }

  /**
   * Получить прицепы для публичного сайта (только видимые isVisible !== false)
   */
  async getTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]> {
    let trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    
    // Добавляем compatibility на основе категории
    trailers = trailers.map(t => this.addCompatibility(t));
    
    // Фильтр видимости - скрываем прицепы с isVisible === false
    // undefined считается как true (видимый по умолчанию)
    trailers = trailers.filter(t => t.isVisible !== false);
    
    if (params?.category && params.category !== 'all') {
      trailers = trailers.filter(t => t.category === params.category);
    }
    
    if (params?.q) {
      const parsed = parseSearchQuery(params.q);
      
      trailers = trailers.filter(t => {
        // 1. Standard text search (Model or Name)
        if (t.model.toLowerCase().includes(parsed.raw) || 
            t.name.toLowerCase().includes(parsed.raw)) {
          return true;
        }

        // 2. Dimensions Search (Body size)
        if (parsed.targetDims) {
          const tDims = parseTrailerDimensions(t.dimensions);
          if (tDims) {
            // Check if trailer body is at least the requested size
            if (tDims.length >= parsed.targetDims.length && 
                tDims.width >= parsed.targetDims.width) {
              return true;
            }
          }
        }

        // 3. Vehicle Type Search
        if (parsed.vehicleType) {
          // Check compatibility
          const isCompatible = t.compatibility?.includes(parsed.vehicleType as any) || 
                               (parsed.vehicleType === 'boat' && t.category === 'water');
          
          if (isCompatible) {
            if (parsed.targetLength) {
              // Check max vehicle length
              let maxLen = t.maxVehicleLength;
              
              // Fallback for boat trailers that might store length in bodyDimensions
              if (!maxLen && t.category === 'water' && t.bodyDimensions) {
                 // Try to parse "5000" or "5.0" from bodyDimensions if it's just a number
                 const bd = parseFloat(t.bodyDimensions);
                 if (!isNaN(bd)) {
                    maxLen = bd < 20 ? bd * 1000 : bd;
                 }
              }

              if (maxLen) {
                // Trailer must be able to fit the boat (maxLen >= targetLength)
                return maxLen >= parsed.targetLength;
              }
              
              // If we can't determine max length, include it to be safe
              return true;
            }
            return true;
          }
        }

        return false;
      });
    }
    
    return trailers;
  }

  /**
   * Получить ВСЕ прицепы для админки (включая скрытые isVisible === false)
   */
  async getAllTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]> {
    let trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    
    // Добавляем compatibility на основе категории
    trailers = trailers.map(t => this.addCompatibility(t));
    
    // НЕ фильтруем по isVisible - это для админки
    
    if (params?.category && params.category !== 'all') {
      trailers = trailers.filter(t => t.category === params.category);
    }
    
    if (params?.q) {
      const q = params.q.toLowerCase();
      trailers = trailers.filter(t =>
        t.model.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
      );
    }
    
    return trailers;
  }

  async getTrailer(id: string): Promise<Trailer | null> {
    const trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    const trailer = trailers.find(t => t.id === id);
    return trailer ? this.addCompatibility(trailer) : null;
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

  async deleteTrailer(id: string): Promise<void> {
    const trailers = this.get<Trailer>(STORAGE_KEYS.TRAILERS);
    const filtered = trailers.filter(t => t.id !== id);
    this.set(STORAGE_KEYS.TRAILERS, filtered);
  }

  // --- Accessories ---

  async getAccessories(): Promise<Accessory[]> {
    return this.get<Accessory>(STORAGE_KEYS.ACCESSORIES);
  }

  async getAccessory(id: string): Promise<Accessory | null> {
    const accessories = this.get<Accessory>(STORAGE_KEYS.ACCESSORIES);
    return accessories.find(a => a.id === id) || null;
  }

  async saveAccessory(accessory: Accessory): Promise<Accessory> {
    const accessories = this.get<Accessory>(STORAGE_KEYS.ACCESSORIES);
    const index = accessories.findIndex(a => a.id === accessory.id);
    
    if (index >= 0) {
      accessories[index] = accessory;
    } else {
      accessories.push(accessory);
    }
    
    this.set(STORAGE_KEYS.ACCESSORIES, accessories);
    return accessory;
  }

  async deleteAccessory(id: string): Promise<void> {
    const accessories = this.get<Accessory>(STORAGE_KEYS.ACCESSORIES);
    const filtered = accessories.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ACCESSORIES, filtered);
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

  async deleteOrder(id: string): Promise<void> {
    const orders = this.get<Order>(STORAGE_KEYS.ORDERS);
    const filtered = orders.filter(o => o.id !== id);
    this.set(STORAGE_KEYS.ORDERS, filtered);
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

  async deleteCustomer(id: string): Promise<void> {
    const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
    const filtered = customers.filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CUSTOMERS, filtered);
  }

  // --- Users ---

  async getUsers(): Promise<AdminUser[]> {
    return this.get<AdminUser>(STORAGE_KEYS.USERS);
  }

  async getUser(id: string): Promise<AdminUser | null> {
    const users = this.get<AdminUser>(STORAGE_KEYS.USERS);
    return users.find(u => u.id === id) || null;
  }

  async saveUser(user: AdminUser): Promise<AdminUser> {
    const users = this.get<AdminUser>(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    
    this.set(STORAGE_KEYS.USERS, users);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const users = this.get<AdminUser>(STORAGE_KEYS.USERS);
    const filtered = users.filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, filtered);
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

  async initializeData(trailers: Trailer[], accessories: Accessory[], defaultSettings: Settings, orders: Order[] = []): Promise<void> {
    // Always update catalog data from source code to reflect changes
    this.set(STORAGE_KEYS.TRAILERS, trailers);
    this.set(STORAGE_KEYS.ACCESSORIES, accessories);

    if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      return;
    }
    
    this.saveSettings(defaultSettings);
    
    // Пустые массивы для заказов и клиентов, если не переданы
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) this.set(STORAGE_KEYS.ORDERS, orders);
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) this.set(STORAGE_KEYS.CUSTOMERS, []);
    
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // ========== VEHICLES ==========
  
  async getVehicles(): Promise<VehicleModel[]> {
    const stored = localStorage.getItem('onr_vehicles');
    if (stored) {
      try {
        const db = JSON.parse(stored) as VehicleDatabase;
        return db.vehicles;
      } catch (e) {
        console.error('Error parsing stored vehicles', e);
      }
    }
    return (defaultVehiclesDb as any).vehicles as VehicleModel[];
  }

  async searchVehicles(query: string): Promise<VehicleModel[]> {
    const vehicles = await this.getVehicles();
    return searchVehicles(vehicles, query).map(r => r.vehicle);
  }

  async importVehicles(data: VehicleDatabase): Promise<void> {
    localStorage.setItem('onr_vehicles', JSON.stringify(data));
  }

  async getVehiclesVersion(): Promise<number> {
    const stored = localStorage.getItem('onr_vehicles');
    if (stored) {
      try {
        const db = JSON.parse(stored) as VehicleDatabase;
        return db.version;
      } catch (e) {
        return 0;
      }
    }
    return (defaultVehiclesDb as any).version;
  }

  async syncVehiclesFromCloud(): Promise<void> {
    // No-op for local provider
  }
}

