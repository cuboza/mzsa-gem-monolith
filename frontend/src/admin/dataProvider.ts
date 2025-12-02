import { DataProvider } from 'react-admin';
import { db } from '../services/api';
import { Trailer, Order, Customer, Accessory, Settings } from '../types';

// Вспомогательная функция фильтрации
const filterData = (data: any[], filter: any) => {
  if (!filter) return data;
  
  return data.filter(item => {
    return Object.keys(filter).every(key => {
      const itemValue = String(item[key] || '').toLowerCase();
      const filterValue = String(filter[key] || '').toLowerCase();
      
      // Поддержка поиска по q (q обычно ищет по всем полям, но упростим)
      if (key === 'q') {
        return JSON.stringify(item).toLowerCase().includes(filterValue);
      }
      
      return itemValue.includes(filterValue);
    });
  });
};

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    let data: any[] = [];

    switch (resource) {
      case 'orders':
        data = await db.getOrders();
        break;
      case 'trailers':
        // Для админки используем getAllTrailers - показываем ВСЕ прицепы (включая скрытые)
        data = await db.getAllTrailers();
        break;
      case 'customers':
        data = await db.getCustomers();
        break;
      case 'accessories':
        data = await db.getAccessories();
        break;
      case 'users':
        data = await db.getUsers();
        break;
      case 'settings':
        // Settings is a singleton, but React Admin expects a list
        const settings = await db.getSettings();
        data = settings ? [{ id: 'default', ...settings }] : [];
        break;
      default:
        throw new Error(`Unknown resource ${resource}`);
    }

    // Фильтрация
    data = filterData(data, params.filter);

    // Сортировка
    data.sort((a, b) => {
      // Обработка вложенных полей (например customer.name)
      const getField = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
      
      const valA = getField(a, field);
      const valB = getField(b, field);

      if (valA < valB) return order === 'ASC' ? -1 : 1;
      if (valA > valB) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    // Пагинация
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
      data: data.slice(start, end),
      total: data.length
    };
  },

  getOne: async (resource, params) => {
    let item;
    const id = String(params.id);
    switch (resource) {
      case 'orders':
        item = await db.getOrder(id);
        break;
      case 'trailers':
        item = await db.getTrailer(id);
        break;
      case 'customers':
        item = await db.getCustomer(id);
        break;
      case 'accessories':
        item = await db.getAccessory(id);
        break;
      case 'users':
        item = await db.getUser(id);
        break;
      case 'settings':
        const settings = await db.getSettings();
        item = settings ? { id: 'default', ...settings } : null;
        break;
    }
    
    if (!item) throw new Error('Item not found');
    return { data: item } as any;
  },

  getMany: async (resource, params) => {
    let data: any[] = [];
    switch (resource) {
      case 'orders': data = await db.getOrders(); break;
      case 'trailers': data = await db.getAllTrailers(); break;  // Для админки - все прицепы
      case 'customers': data = await db.getCustomers(); break;
      case 'accessories': data = await db.getAccessories(); break;
      case 'users': data = await db.getUsers(); break;
      case 'settings': 
        const s = await db.getSettings();
        data = s ? [{ id: 'default', ...s }] : [];
        break;
    }
    
    const items = data.filter(item => params.ids.includes(item.id));
    return { data: items } as any;
  },

  getManyReference: () => Promise.resolve({ data: [], total: 0 }),

  create: async (resource, params) => {
    // В этом проекте создание через админку не приоритет, но реализуем базово
    const newItem = {
      ...params.data,
      id: `${resource}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Здесь нужно было бы вызвать db.createSomething, но в интерфейсе не все методы есть
    // Для простоты добавим в методах update через LocalStorageProvider расширение
    // Но правильнее расширить интерфейс. Пока оставим упрощенно:
    
    if (resource === 'orders') await db.createOrder(newItem as unknown as Order);
    else if (resource === 'trailers') await db.saveTrailer(newItem as unknown as Trailer);
    else if (resource === 'customers') await db.saveCustomer(newItem as unknown as Customer);
    else if (resource === 'accessories') await db.saveAccessory(newItem as unknown as Accessory);
    else if (resource === 'users') await db.saveUser(newItem as any);

    return { data: newItem } as any;
  },

  update: async (resource, params) => {
    let updatedItem;
    const id = String(params.id);
    if (resource === 'orders') {
      updatedItem = await db.updateOrder(id, params.data);
    } else if (resource === 'trailers') {
      updatedItem = await db.saveTrailer({ ...params.previousData, ...params.data } as Trailer);
    } else if (resource === 'customers') {
      updatedItem = await db.saveCustomer({ ...params.previousData, ...params.data } as Customer);
    } else if (resource === 'accessories') {
      updatedItem = await db.saveAccessory({ ...params.previousData, ...params.data } as Accessory);
    } else if (resource === 'users') {
      updatedItem = await db.saveUser({ ...params.previousData, ...params.data } as any);
    } else if (resource === 'settings') {
      // Remove id from data before saving
      const { id, ...settingsData } = params.data;
      const saved = await db.saveSettings(settingsData as Settings);
      updatedItem = { id: 'default', ...saved };
    }

    return { data: updatedItem } as any;
  },

  updateMany: () => Promise.resolve({ data: [] }),
  
  delete: async (resource, params) => {
    const id = String(params.id);
    if (resource === 'orders') await db.deleteOrder(id);
    else if (resource === 'trailers') await db.deleteTrailer(id);
    else if (resource === 'customers') await db.deleteCustomer(id);
    else if (resource === 'accessories') await db.deleteAccessory(id);
    else if (resource === 'users') await db.deleteUser(id);
    
    return { data: params.previousData } as any;
  },
  
  deleteMany: async (resource, params) => {
    const ids = params.ids.map(String);
    
    // Последовательное удаление, так как в интерфейсе нет deleteMany
    for (const id of ids) {
      if (resource === 'orders') await db.deleteOrder(id);
      else if (resource === 'trailers') await db.deleteTrailer(id);
      else if (resource === 'customers') await db.deleteCustomer(id);
      else if (resource === 'accessories') await db.deleteAccessory(id);
      else if (resource === 'users') await db.deleteUser(id);
    }
    
    return { data: ids } as any;
  },
};

