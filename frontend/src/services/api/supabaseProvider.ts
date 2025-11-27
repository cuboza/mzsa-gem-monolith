/**
 * Supabase Database Provider
 * Работает с существующей схемой Supabase
 */

import { supabase } from './supabaseClient';
import type { IDatabaseProvider } from './interface';
import type { Trailer, Accessory, Order, Customer, Settings } from '../../types';

// Маппинг из Supabase в наши типы
function mapSupabaseTrailer(row: any): Trailer {
  return {
    id: row.slug || row.id,
    model: row.model,
    name: row.name,
    category: mapCategory(row.category_id),
    price: row.retail_price || row.base_price || 0,
    capacity: 0, // будет из specifications
    description: row.description,
    image: row.main_image_url || '/images/placeholder.jpg',
    images: [], // загрузим отдельно
    features: [], // загрузим отдельно
    specs: {}, // загрузим отдельно
    suspension: '',
    brakes: '',
    availability: mapAvailability(row.availability),
    isPopular: row.badges?.includes('popular') || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseOption(row: any): Accessory {
  return {
    id: row.id,
    name: row.name,
    price: row.retail_price || row.base_price || 0,
    oldPrice: null,
    category: mapOptionCategory(row.option_category),
    description: row.description || '',
    image: row.main_image_url || '/images/placeholder.jpg',
    images: [],
    compatibility: [], // загрузим через trailer_options
    compatibleWith: [],
    required: false,
    stock: row.availability,
    isPopular: false,
  };
}

function mapSupabaseLead(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.lead_number,
    date: row.created_at,
    status: mapLeadStatus(row.status),
    customer: {
      name: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
      region: 'ХМАО',
      city: row.customer_city || '',
    },
    configuration: {
      trailer: {} as Trailer,
      accessories: [],
      totalPrice: 0,
    },
    delivery: {
      method: 'pickup',
      region: 'ХМАО',
      city: row.customer_city || '',
    },
    timeline: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseCustomer(row: any): Customer {
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Без имени',
    phone: row.phone,
    email: row.email,
    region: 'ХМАО',
    city: row.city || '',
    orders: [],
    totalSpent: row.total_spent || 0,
    createdAt: row.created_at,
    lastOrderAt: row.last_order_at,
  };
}

// Хелперы для маппинга
function mapCategory(categoryId: string | null): Trailer['category'] {
  // TODO: загрузить категории и маппить по ID
  return 'general';
}

function mapAvailability(availability: string): Trailer['availability'] {
  switch (availability) {
    case 'in_stock': return 'in_stock';
    case 'on_order': return 'days_7_14';
    default: return 'days_7_14';
  }
}

function mapOptionCategory(category: string | null): Accessory['category'] {
  const categoryMap: Record<string, Accessory['category']> = {
    'loading': 'loading',
    'support': 'support',
    'spare': 'spare',
    'cover': 'cover',
    'safety': 'safety',
    'guides': 'guides',
    'boat_support': 'boat_support',
  };
  return categoryMap[category || ''] || 'spare';
}

function mapLeadStatus(status: string): Order['status'] {
  const statusMap: Record<string, Order['status']> = {
    'new': 'new',
    'processing': 'processing',
    'contacted': 'processing',
    'confirmed': 'processing',
    'in_production': 'shipping',
    'ready': 'ready',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };
  return statusMap[status] || 'new';
}

// Supabase Provider
export const SupabaseProvider: IDatabaseProvider = {
  // ========== TRAILERS ==========
  async getTrailers(): Promise<Trailer[]> {
    // Загружаем прицепы без join (images связаны через item_id)
    const { data: trailersData, error: trailersError } = await supabase
      .from('trailers')
      .select('*')
      .eq('visible_on_site', true)
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (trailersError) {
      console.error('Error fetching trailers:', trailersError);
      return [];
    }

    if (!trailersData || trailersData.length === 0) {
      return [];
    }

    // Получаем ID всех прицепов
    const trailerIds = trailersData.map((t: any) => t.id);

    // Загружаем связанные данные параллельно
    const [specificationsRes, featuresRes, imagesRes] = await Promise.all([
      supabase.from('specifications').select('*').in('trailer_id', trailerIds),
      supabase.from('features').select('*').in('trailer_id', trailerIds),
      supabase.from('images').select('*').eq('item_type', 'trailer').in('item_id', trailerIds),
    ]);

    // Группируем по trailer_id
    const specsMap = new Map<string, any[]>();
    (specificationsRes.data || []).forEach((spec: any) => {
      const arr = specsMap.get(spec.trailer_id) || [];
      arr.push(spec);
      specsMap.set(spec.trailer_id, arr);
    });

    const featuresMap = new Map<string, any[]>();
    (featuresRes.data || []).forEach((feat: any) => {
      const arr = featuresMap.get(feat.trailer_id) || [];
      arr.push(feat);
      featuresMap.set(feat.trailer_id, arr);
    });

    const imagesMap = new Map<string, any[]>();
    (imagesRes.data || []).forEach((img: any) => {
      const arr = imagesMap.get(img.item_id) || [];
      arr.push(img);
      imagesMap.set(img.item_id, arr);
    });

    return trailersData.map((row: any) => {
      const trailer = mapSupabaseTrailer(row);
      
      // Добавляем specifications
      const specs = specsMap.get(row.id) || [];
      if (specs.length > 0) {
        trailer.specs = {};
        specs.forEach((spec: any) => {
          trailer.specs![spec.key] = spec.value_numeric || spec.value_text;
          if (spec.key === 'gruzopodemnost') {
            trailer.capacity = spec.value_numeric || 0;
          }
        });
      }
      
      // Добавляем features
      const features = featuresMap.get(row.id) || [];
      if (features.length > 0) {
        trailer.features = features
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((f: any) => f.text);
      }
      
      // Добавляем images
      const images = imagesMap.get(row.id) || [];
      if (images.length > 0) {
        trailer.images = images
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((img: any) => img.url);
        if (trailer.images.length > 0) {
          trailer.image = trailer.images[0];
        }
      }
      
      return trailer;
    });
  },

  async getTrailerById(id: string): Promise<Trailer | null> {
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .or(`slug.eq.${id},id.eq.${id}`)
      .single();

    if (error || !data) {
      console.error('Error fetching trailer:', error);
      return null;
    }

    const trailer = mapSupabaseTrailer(data);
    
    // Загружаем связанные данные параллельно
    const [specificationsRes, featuresRes, imagesRes] = await Promise.all([
      supabase.from('specifications').select('*').eq('trailer_id', data.id),
      supabase.from('features').select('*').eq('trailer_id', data.id),
      supabase.from('images').select('*').eq('item_type', 'trailer').eq('item_id', data.id),
    ]);
    
    if (specificationsRes.data) {
      trailer.specs = {};
      specificationsRes.data.forEach((spec: any) => {
        trailer.specs![spec.key] = spec.value_numeric || spec.value_text;
        if (spec.key === 'gruzopodemnost') {
          trailer.capacity = spec.value_numeric || 0;
        }
      });
    }
    
    if (featuresRes.data) {
      trailer.features = featuresRes.data
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((f: any) => f.text);
    }
    
    if (imagesRes.data) {
      trailer.images = imagesRes.data
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.url);
      if (trailer.images.length > 0) {
        trailer.image = trailer.images[0];
      }
    }
    
    return trailer;
  },

  async createTrailer(trailer: Partial<Trailer>): Promise<Trailer> {
    const { data, error } = await supabase
      .from('trailers')
      .insert({
        slug: trailer.id,
        model: trailer.model,
        name: trailer.name,
        description: trailer.description,
        base_price: trailer.price,
        retail_price: trailer.price,
        main_image_url: trailer.image,
        availability: trailer.availability === 'in_stock' ? 'in_stock' : 'on_order',
        status: 'active',
        visible_on_site: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseTrailer(data);
  },

  async updateTrailer(id: string, trailer: Partial<Trailer>): Promise<Trailer> {
    const { data, error } = await supabase
      .from('trailers')
      .update({
        model: trailer.model,
        name: trailer.name,
        description: trailer.description,
        base_price: trailer.price,
        retail_price: trailer.price,
        main_image_url: trailer.image,
        availability: trailer.availability === 'in_stock' ? 'in_stock' : 'on_order',
        updated_at: new Date().toISOString(),
      })
      .or(`slug.eq.${id},id.eq.${id}`)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseTrailer(data);
  },

  async deleteTrailer(id: string): Promise<void> {
    const { error } = await supabase
      .from('trailers')
      .delete()
      .or(`slug.eq.${id},id.eq.${id}`);

    if (error) throw new Error(error.message);
  },

  // ========== ACCESSORIES (OPTIONS) ==========
  async getAccessories(): Promise<Accessory[]> {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('visible_on_site', true)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching options:', error);
      return [];
    }

    // Загружаем связи с прицепами
    const { data: trailerOptions } = await supabase
      .from('trailer_options')
      .select('option_id, trailer_id, trailers(slug)');

    const optionToTrailers: Record<string, string[]> = {};
    (trailerOptions || []).forEach((to: any) => {
      if (!optionToTrailers[to.option_id]) {
        optionToTrailers[to.option_id] = [];
      }
      if (to.trailers?.slug) {
        optionToTrailers[to.option_id].push(to.trailers.slug);
      }
    });

    return (data || []).map((row: any) => {
      const accessory = mapSupabaseOption(row);
      accessory.compatibleWith = optionToTrailers[row.id] || ['all'];
      accessory.compatibility = accessory.compatibleWith;
      return accessory;
    });
  },

  async getAccessoryById(id: string): Promise<Accessory | null> {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapSupabaseOption(data);
  },

  async createAccessory(accessory: Partial<Accessory>): Promise<Accessory> {
    const { data, error } = await supabase
      .from('options')
      .insert({
        name: accessory.name,
        description: accessory.description,
        base_price: accessory.price,
        retail_price: accessory.price,
        option_category: accessory.category,
        main_image_url: accessory.image,
        status: 'active',
        visible_on_site: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseOption(data);
  },

  async updateAccessory(id: string, accessory: Partial<Accessory>): Promise<Accessory> {
    const { data, error } = await supabase
      .from('options')
      .update({
        name: accessory.name,
        description: accessory.description,
        base_price: accessory.price,
        retail_price: accessory.price,
        option_category: accessory.category,
        main_image_url: accessory.image,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseOption(data);
  },

  async deleteAccessory(id: string): Promise<void> {
    const { error } = await supabase
      .from('options')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ========== ORDERS (LEADS) ==========
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return (data || []).map(mapSupabaseLead);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_items (*)
      `)
      .or(`id.eq.${id},lead_number.eq.${id}`)
      .single();

    if (error || !data) return null;
    return mapSupabaseLead(data);
  },

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_items (*)
      `)
      .eq('lead_number', orderNumber)
      .single();

    if (error || !data) return null;
    return mapSupabaseLead(data);
  },

  async createOrder(order: Partial<Order>): Promise<Order> {
    // Генерируем номер заказа
    const orderNumber = `ONR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('leads')
      .insert({
        lead_number: orderNumber,
        customer_name: order.customer?.name,
        customer_phone: order.customer?.phone,
        customer_email: order.customer?.email,
        customer_city: order.customer?.city,
        status: 'new',
        type: 'order',
        source: 'website_form',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Добавляем позиции заказа
    if (order.configuration?.trailer) {
      await supabase.from('lead_items').insert({
        lead_id: data.id,
        item_id: order.configuration.trailer.id,
        item_type: 'trailer',
        item_name: order.configuration.trailer.name,
        quantity: 1,
        unit_price: order.configuration.trailer.price,
      });
    }

    if (order.configuration?.accessories) {
      for (const acc of order.configuration.accessories) {
        await supabase.from('lead_items').insert({
          lead_id: data.id,
          item_id: acc.id,
          item_type: 'option',
          item_name: acc.name,
          quantity: 1,
          unit_price: acc.price,
        });
      }
    }

    return mapSupabaseLead(data);
  },

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const statusMap: Record<string, string> = {
      'new': 'new',
      'processing': 'processing',
      'shipping': 'in_production',
      'ready': 'ready',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };

    const { data, error } = await supabase
      .from('leads')
      .update({
        status: statusMap[order.status || 'new'] || 'new',
        customer_name: order.customer?.name,
        customer_phone: order.customer?.phone,
        customer_email: order.customer?.email,
        customer_city: order.customer?.city,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseLead(data);
  },

  async deleteOrder(id: string): Promise<void> {
    // Сначала удаляем позиции
    await supabase.from('lead_items').delete().eq('lead_id', id);
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ========== CUSTOMERS ==========
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return (data || []).map(mapSupabaseCustomer);
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapSupabaseCustomer(data);
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const nameParts = (customer.name || '').split(' ');
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseCustomer(data);
  },

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const nameParts = (customer.name || '').split(' ');
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSupabaseCustomer(data);
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ========== SETTINGS ==========
  async getSettings(): Promise<Settings> {
    // Настройки храним в таблице cities и warehouses
    const { data: cities } = await supabase
      .from('cities')
      .select('*')
      .eq('visible_on_site', true)
      .order('priority', { ascending: false });

    const defaultSettings: Settings = {
      contacts: {
        phone: '+7 (3462) 22-33-55',
        email: 'info@o-n-r.ru',
        workHours: '9:00 - 20:00',
        addresses: (cities || []).map((city: any) => ({
          region: 'ХМАО' as const,
          city: city.city,
          address: city.office_address || '',
          coordinates: city.latitude && city.longitude 
            ? [city.latitude, city.longitude] as [number, number]
            : undefined,
        })),
      },
      delivery: {
        regions: [
          { name: 'ХМАО', cities: ['Сургут', 'Нижневартовск', 'Ноябрьск'], cost: 0, days: '1-3 дня' },
          { name: 'ЯНАО', cities: ['Новый Уренгой', 'Ноябрьск'], cost: 5000, days: '3-7 дней' },
        ],
      },
      about: {
        description: 'Официальный дилер МЗСА в ХМАО и ЯНАО',
        advantages: [],
        certificates: [],
      },
    };

    return defaultSettings;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    // Для обновления настроек нужна отдельная таблица settings
    // Пока возвращаем то что есть
    console.warn('Settings update not implemented for Supabase');
    return this.getSettings();
  },

  // ========== INIT ==========
  async initializeData(): Promise<void> {
    // Данные уже в Supabase, инициализация не нужна
    console.log('Supabase provider initialized');
  },
};

export default SupabaseProvider;
