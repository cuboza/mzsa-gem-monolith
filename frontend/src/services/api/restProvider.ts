import { IDatabaseProvider } from './interface';
import { Trailer, Order, Customer, Accessory, Settings, AdminUser } from '../../types';

// API URL: 
// - В режиме разработки с отдельным бэкендом: VITE_API_URL=http://localhost:3001
// - В монолитном режиме (один сервер): используем /api (относительный путь)
const API_URL = import.meta.env.VITE_API_URL || '/api';

export class RestProvider implements IDatabaseProvider {
  // --- Users (Stubs) ---
  async getUsers(): Promise<AdminUser[]> { return []; }
  async getUser(id: string): Promise<AdminUser | null> { return null; }
  async saveUser(user: AdminUser): Promise<AdminUser> { return user; }
  async deleteUser(id: string): Promise<void> {}

  async initializeData(trailers: Trailer[], accessories: Accessory[], settings: Settings, orders: Order[] = []): Promise<void> {
    // В REST API мы предполагаем, что данные уже есть на сервере.
    // Но для json-server можно проверить, пустая ли база, и если да - заполнить.
    // Пока оставим пустым, так как db.json мы создали вручную.
    console.log('RestProvider initialized');
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`);
    return res.json();
  }

  async getOrder(id: string): Promise<Order | null> {
    const res = await fetch(`${API_URL}/orders/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const res = await fetch(`${API_URL}/orders?orderNumber=${orderNumber}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.length > 0 ? data[0] : null;
  }

  async createOrder(order: Order): Promise<Order> {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.json();
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async deleteOrder(id: string): Promise<void> {
    await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
  }

  // --- Trailers ---
  async getTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]> {
    // Строим query string вручную, так как new URL() не работает с относительными путями
    const queryParams: string[] = [];
    if (params?.q) queryParams.push(`q=${encodeURIComponent(params.q)}`);
    if (params?.category && params.category !== 'all') queryParams.push(`category=${encodeURIComponent(params.category)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const res = await fetch(`${API_URL}/trailers${queryString}`);
    return res.json();
  }

  async getTrailer(id: string): Promise<Trailer | null> {
    const res = await fetch(`${API_URL}/trailers/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async saveTrailer(trailer: Trailer): Promise<Trailer> {
    // Check if exists to decide POST or PUT/PATCH
    const existing = await this.getTrailer(trailer.id);
    if (existing) {
      const res = await fetch(`${API_URL}/trailers/${trailer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trailer)
      });
      return res.json();
    } else {
      const res = await fetch(`${API_URL}/trailers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trailer)
      });
      return res.json();
    }
  }

  async deleteTrailer(id: string): Promise<void> {
    await fetch(`${API_URL}/trailers/${id}`, { method: 'DELETE' });
  }

  // --- Accessories ---
  async getAccessories(): Promise<Accessory[]> {
    const res = await fetch(`${API_URL}/accessories`);
    return res.json();
  }

  async getAccessory(id: string): Promise<Accessory | null> {
    const res = await fetch(`${API_URL}/accessories/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async saveAccessory(accessory: Accessory): Promise<Accessory> {
    const existing = await this.getAccessory(accessory.id);
    if (existing) {
      const res = await fetch(`${API_URL}/accessories/${accessory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessory)
      });
      return res.json();
    } else {
      const res = await fetch(`${API_URL}/accessories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accessory)
      });
      return res.json();
    }
  }

  async deleteAccessory(id: string): Promise<void> {
    await fetch(`${API_URL}/accessories/${id}`, { method: 'DELETE' });
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_URL}/customers`);
    return res.json();
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const res = await fetch(`${API_URL}/customers/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    const existing = await this.getCustomer(customer.id);
    if (existing) {
      const res = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      return res.json();
    } else {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      return res.json();
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
  }

  // --- Settings ---
  async getSettings(): Promise<Settings | null> {
    const res = await fetch(`${API_URL}/settings`);
    return res.json();
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'POST', // json-server treats object root as single resource usually, but here settings is an object in db.json. 
                      // Actually json-server expects collections. 
                      // If 'settings' is an object in db.json, GET /settings returns it.
                      // POST /settings might fail if it's not a list.
                      // Let's assume we treat it as a single document update.
                      // json-server allows updating the whole db object via lowdb but via API it's tricky for non-collections.
                      // Workaround: wrap settings in an array or use a custom route.
                      // For standard json-server, let's try PUT /settings
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
}
