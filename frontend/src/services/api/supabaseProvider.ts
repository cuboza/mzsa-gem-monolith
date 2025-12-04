/**
 * Supabase Database Provider
 * Работает с существующей схемой Supabase
 */

import { supabase } from './supabaseClient';
import type { IDatabaseProvider, StockSummary, StockItem, StockMovement, StockMovementFilters } from './interface';
import type { Trailer, Accessory, Order, Customer, Settings, AdminUser, Warehouse } from '../../types';
import { VehicleModel, VehicleDatabase } from '../../features/vehicles/vehicleTypes';
import { parseSearchQuery, mapVehicleCategoryToTrailerCategory } from '../../utils/searchParser';

// Маппинг из Supabase в наши типы
function mapSupabaseTrailer(row: any, categories?: Map<string, string>): Trailer {
  // Определяем категорию по category_id
  let category: Trailer['category'] = 'general';
  let compatibility: Trailer['compatibility'] | undefined = undefined;
  
  if (categories && row.category_id) {
    const slug = categories.get(row.category_id);
    if (slug === 'water') {
      category = 'water';
      compatibility = ['boat']; // Лодочные прицепы совместимы с лодками
    } else if (slug === 'commercial') {
      category = 'commercial';
      compatibility = ['cargo', 'car', 'snowmobile', 'atv']; // Коммерческие - в первую очередь для грузов, также авто, вездеходов, квадроциклов
    } else {
      category = 'general';
      compatibility = ['snowmobile', 'atv', 'motorcycle']; // Универсальные - для мототехники, вездеходов, квадроциклов
    }
  }
  
  return {
    id: row.slug || row.id,
    model: row.model,
    name: row.name,
    category,
    price: row.retail_price || row.base_price || 0,
    capacity: 0, // будет из specifications
    description: row.description,
    image: row.main_image_url || '/images/placeholder.jpg',
    images: [], // загрузим отдельно
    features: [], // загрузим отдельно
    specs: {
      dimensions: '',
      capacity: '',
      weight: '',
      axles: 1,
    }, // загрузим отдельно
    compatibility, // Добавляем совместимость с техникой
    maxVehicleLength: row.max_vehicle_length || undefined,
    maxVehicleWidth: row.max_vehicle_width || undefined,
    maxVehicleWeight: row.max_vehicle_weight || undefined,
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

function mapSupabaseAdminUser(row: any): AdminUser {
  return {
    id: String(row.id ?? row.username ?? `temp-${Date.now()}`),
    username: row.username || 'unknown',
    password: row.password || undefined,
    fullName: row.full_name || row.username || 'Без имени',
    role: row.role === 'admin' ? 'admin' : 'manager',
    isActive: row.is_active ?? true,
    permissions: row.permissions || undefined,
  };
}

// Кэш категорий
let categoriesCache: Map<string, string> | null = null;

async function loadCategories(): Promise<Map<string, string>> {
  if (categoriesCache) return categoriesCache;
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug');
  
  if (error || !data) {
    console.error('Error loading categories:', error);
    return new Map();
  }
  
  categoriesCache = new Map(data.map((c: any) => [c.id, c.slug]));
  return categoriesCache;
}

// Supabase Provider
export const SupabaseProvider: IDatabaseProvider = {
  // ========== TRAILERS ==========
  async getTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]> {
    // Загружаем категории для маппинга
    const categories = await loadCategories();
    
    // Парсим умный поиск
    let parsedSearch = params?.q ? parseSearchQuery(params.q) : null;
    
    // Находим category_id по slug если передана категория
    let categoryId: string | null = null;
    let targetCategorySlug = params?.category;
    
    // Если категория не указана явно, пробуем определить по поисковому запросу
    if (!targetCategorySlug && parsedSearch?.category) {
      // Мапим категорию техники на категорию прицепа
      targetCategorySlug = mapVehicleCategoryToTrailerCategory(parsedSearch.category) || parsedSearch.category;
    }
    
    if (targetCategorySlug && targetCategorySlug !== 'all') {
      for (const [id, slug] of categories) {
        if (slug === targetCategorySlug) {
          categoryId = id;
          break;
        }
      }
    }
    
    // Базовый запрос
    let query = supabase
      .from('trailers')
      .select('*')
      .eq('visible_on_site', true)
      .eq('status', 'active');
    
    // Фильтр по категории
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Поиск по тексту (используем очищенный запрос или исходный)
    const searchText = parsedSearch?.cleanQuery || params?.q;
    if (searchText && searchText.trim()) {
      query = query.or(`name.ilike.%${searchText}%,model.ilike.%${searchText}%`);
    }
    
    const { data: trailersData, error: trailersError } = await query
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
      const trailer = mapSupabaseTrailer(row, categories);
      
      // Добавляем isVisible из visible_on_site (для публичного сайта всегда true,
      // так как фильтр .eq('visible_on_site', true) уже применён в запросе)
      trailer.isVisible = row.visible_on_site ?? true;
      
      // Добавляем specifications
      const specs = specsMap.get(row.id) || [];
      if (specs.length > 0) {
        trailer.specs = { dimensions: '', capacity: '', weight: '', axles: 1 };
        specs.forEach((spec: any) => {
          trailer.specs![spec.key] = spec.value_numeric || spec.value_text;
          if (spec.key === 'gruzopodemnost') {
            trailer.capacity = spec.value_numeric || 0;
          }
          // Парсим длину судна/техники для фильтрации
          if (spec.key === 'dlina_sudna' || spec.key === 'dlina_tehniki') {
            const lengthValue = spec.value_numeric || parseInt(String(spec.value_text || '').replace(/\D/g, ''));
            if (lengthValue) {
              trailer.maxVehicleLength = lengthValue;
            }
          }
          // Парсим объём кузова для грузовых
          if (spec.key === 'objem_kuzova' || spec.key === 'volume') {
            const volumeValue = spec.value_numeric || parseFloat(String(spec.value_text || '').replace(',', '.').replace(/[^\d.]/g, ''));
            if (volumeValue) {
              trailer.maxVehicleVolume = volumeValue;
            }
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

  /**
   * Получить ВСЕ прицепы для админки (включая скрытые visible_on_site = false)
   */
  async getAllTrailers(params?: { q?: string; category?: string }): Promise<Trailer[]> {
    // Загружаем категории для маппинга
    const categories = await loadCategories();
    
    // Находим category_id по slug если передана категория
    let categoryId: string | null = null;
    if (params?.category && params.category !== 'all') {
      for (const [id, slug] of categories) {
        if (slug === params.category) {
          categoryId = id;
          break;
        }
      }
    }
    
    // Базовый запрос БЕЗ фильтра visible_on_site - для админки показываем всё
    let query = supabase
      .from('trailers')
      .select('*');
    
    // Фильтр по категории
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Поиск по тексту
    if (params?.q && params.q.trim()) {
      query = query.or(`name.ilike.%${params.q}%,model.ilike.%${params.q}%`);
    }
    
    const { data: trailersData, error: trailersError } = await query
      .order('sort_order', { ascending: true });

    if (trailersError) {
      console.error('Error fetching all trailers for admin:', trailersError);
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
      const trailer = mapSupabaseTrailer(row, categories);
      
      // Добавляем isVisible из visible_on_site
      trailer.isVisible = row.visible_on_site ?? true;
      
      // Добавляем specifications
      const specs = specsMap.get(row.id) || [];
      if (specs.length > 0) {
        trailer.specs = { dimensions: '', capacity: '', weight: '', axles: 1 };
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

  async getTrailer(id: string): Promise<Trailer | null> {
    // Загружаем категории для маппинга
    const categories = await loadCategories();
    
    const { data, error } = await supabase
      .from('trailers')
      .select('*')
      .or(`slug.eq.${id},id.eq.${id}`)
      .single();

    if (error || !data) {
      console.error('Error fetching trailer:', error);
      return null;
    }

    const trailer = mapSupabaseTrailer(data, categories);
    
    // Загружаем связанные данные параллельно
    const [specificationsRes, featuresRes, imagesRes] = await Promise.all([
      supabase.from('specifications').select('*').eq('trailer_id', data.id),
      supabase.from('features').select('*').eq('trailer_id', data.id),
      supabase.from('images').select('*').eq('item_type', 'trailer').eq('item_id', data.id),
    ]);
    
    if (specificationsRes.data) {
      trailer.specs = { dimensions: '', capacity: '', weight: '', axles: 1 };
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

  async saveTrailer(trailer: Trailer): Promise<Trailer> {
    // Загружаем категории для маппинга
    const categories = await loadCategories();
    
    // Проверяем существует ли уже прицеп
    const existing = await this.getTrailer(trailer.id);
    
    if (existing) {
      // Обновляем
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
        .or(`slug.eq.${trailer.id},id.eq.${trailer.id}`)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapSupabaseTrailer(data, categories);
    } else {
      // Создаём новый
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
      return mapSupabaseTrailer(data, categories);
    }
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

  async getAccessory(id: string): Promise<Accessory | null> {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapSupabaseOption(data);
  },

  async saveAccessory(accessory: Accessory): Promise<Accessory> {
    // Проверяем существует ли уже аксессуар
    const existing = await this.getAccessory(accessory.id);
    
    if (existing) {
      // Обновляем
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
        .eq('id', accessory.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapSupabaseOption(data);
    } else {
      // Создаём новый
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
    }
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

  async getOrder(id: string): Promise<Order | null> {
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

    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();

    const insertPayload: any = {
      lead_number: orderNumber,
      customer_name: order.customer?.name,
      customer_phone: order.customer?.phone,
      customer_email: order.customer?.email,
      customer_city: order.customer?.city,
      status: 'new',
      type: 'order',
      source: 'website_form',
    };

    if (user) {
      insertPayload.auth_user_id = user.id;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Собираем позиции для резервирования
    const itemsToReserve: { itemId: string; itemType: 'trailer' | 'option'; quantity: number }[] = [];

    // Добавляем позиции заказа
    if (order.configuration?.trailer) {
      // Получаем UUID прицепа по slug
      const { data: trailerData } = await supabase
        .from('trailers')
        .select('id')
        .eq('slug', order.configuration.trailer.id)
        .single();
      
      const trailerId = trailerData?.id || order.configuration.trailer.id;
      
      await supabase.from('lead_items').insert({
        lead_id: data.id,
        item_id: trailerId,
        item_type: 'trailer',
        item_name: order.configuration.trailer.name,
        quantity: 1,
        unit_price: order.configuration.trailer.price,
      });
      
      itemsToReserve.push({
        itemId: order.configuration.trailer.id,
        itemType: 'trailer',
        quantity: 1,
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
        
        itemsToReserve.push({
          itemId: acc.id,
          itemType: 'option',
          quantity: 1,
        });
      }
    }

    // Резервируем остатки
    if (itemsToReserve.length > 0) {
      const reserveResult = await this.reserveStock?.(data.id, itemsToReserve);
      if (!reserveResult?.success) {
        console.warn('Не удалось зарезервировать остатки:', reserveResult?.error);
        // Не прерываем создание заказа, но логируем предупреждение
      }
    }
    
    // Отправляем email уведомление через Edge Function
    try {
      await supabase.functions.invoke('send-order-confirmation', {
        body: {
          orderNumber,
          customerName: order.customer?.name,
          customerEmail: order.customer?.email,
          customerPhone: order.customer?.phone,
          customerCity: order.customer?.city,
          trailerName: order.configuration?.trailer?.name,
          trailerModel: order.configuration?.trailer?.model,
          trailerPrice: order.configuration?.trailer?.price,
          accessories: order.configuration?.accessories?.map(acc => ({
            name: acc.name,
            price: acc.price,
          })),
          totalPrice: order.configuration?.totalPrice,
          deliveryMethod: order.delivery?.method,
        },
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
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

    // Получаем текущий статус заказа
    const { data: currentOrder } = await supabase
      .from('leads')
      .select('status')
      .eq('id', id)
      .single();
    
    const currentStatus = currentOrder?.status;
    const newStatus = statusMap[order.status || 'new'] || 'new';

    const { data, error } = await supabase
      .from('leads')
      .update({
        status: newStatus,
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

    // Обработка остатков при изменении статуса
    if (currentStatus !== newStatus) {
      // При отмене заказа - освобождаем остатки
      if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
        const releaseResult = await this.releaseStock?.(id);
        if (!releaseResult?.success) {
          console.warn('Не удалось освободить остатки при отмене заказа:', releaseResult?.error);
        }
      }
      
      // При выполнении заказа - списываем остатки окончательно
      if (newStatus === 'completed' && currentStatus !== 'completed') {
        const commitResult = await this.commitStock?.(id);
        if (!commitResult?.success) {
          console.warn('Не удалось списать остатки при завершении заказа:', commitResult?.error);
        }
      }
    }

    return mapSupabaseLead(data);
  },

  async deleteOrder(id: string): Promise<void> {
    // Освобождаем остатки перед удалением
    await this.releaseStock?.(id);
    
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

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapSupabaseCustomer(data);
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    const nameParts = (customer.name || '').split(' ');
    
    // Проверяем существует ли уже клиент
    const existing = await this.getCustomer(customer.id);
    
    if (existing) {
      // Обновляем
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
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapSupabaseCustomer(data);
    } else {
      // Создаём нового
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
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ========== USERS (ADMIN PANEL) ==========
  async getUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.warn('Admin users table is empty or unavailable in Supabase');
        return [];
      }

      return data.map(mapSupabaseAdminUser);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      return [];
    }
  },

  async getUser(id: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return mapSupabaseAdminUser(data);
    } catch (err) {
      console.error('Error fetching admin user:', err);
      return null;
    }
  },

  async saveUser(user: AdminUser): Promise<AdminUser> {
    const payload: Record<string, unknown> = {
      username: user.username,
      password: user.password || null,
      full_name: user.fullName,
      role: user.role,
      is_active: user.isActive,
    };
    
    // Добавляем права только если они переданы
    if (user.permissions !== undefined) {
      payload.permissions = user.permissions;
    }

    try {
      if (user.id) {
        const { data, error } = await supabase
          .from('admin_users')
          .update(payload)
          .eq('id', user.id)
          .select()
          .single();

        if (error || !data) {
          throw error || new Error('User update failed');
        }

        return mapSupabaseAdminUser(data);
      }

      const { data, error } = await supabase
        .from('admin_users')
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('User creation failed');
      }

      return mapSupabaseAdminUser(data);
    } catch (err) {
      console.error('Error saving admin user:', err);
      throw new Error('Не удалось сохранить пользователя');
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error deleting admin user:', err);
      throw new Error('Не удалось удалить пользователя');
    }
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

  async saveSettings(settings: Settings): Promise<Settings> {
    // Для обновления настроек нужна отдельная таблица settings
    // Пока возвращаем то что есть
    console.warn('Settings update not implemented for Supabase');
    return settings;
  },

  // ========== STOCK MANAGEMENT ==========
  
  /**
   * Получить информацию об остатках товара
   */
  async getStock(itemId: string, itemType: 'trailer' | 'option') {
    const tableName = itemType === 'trailer' ? 'trailer_stock' : 'option_stock';
    const itemColumn = itemType === 'trailer' ? 'trailer_id' : 'option_id';
    
    // Сначала получаем реальный UUID по slug (для прицепов)
    let realItemId = itemId;
    if (itemType === 'trailer') {
      const { data: trailer } = await supabase
        .from('trailers')
        .select('id')
        .eq('slug', itemId)
        .single();
      
      if (trailer) {
        realItemId = trailer.id;
      }
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        warehouses (id, name)
      `)
      .eq(itemColumn, realItemId)
      .single();
    
    if (error || !data) return null;
    
    return {
      itemId,
      itemType,
      warehouseId: data.warehouse_id,
      warehouseName: data.warehouses?.name,
      quantity: data.quantity || 0,
      availableQuantity: data.available_quantity || 0,
      reservedQuantity: data.reserved_quantity || 0,
    };
  },

  /**
   * Зарезервировать товары для заказа
   * Уменьшает available_quantity, увеличивает reserved_quantity
   */
  async reserveStock(orderId: string, items: { itemId: string; itemType: 'trailer' | 'option'; quantity: number }[]) {
    const reservedItems: { itemId: string; itemType: string; quantity: number }[] = [];
    
    try {
      for (const item of items) {
        const tableName = item.itemType === 'trailer' ? 'trailer_stock' : 'option_stock';
        const itemColumn = item.itemType === 'trailer' ? 'trailer_id' : 'option_id';
        
        // Получаем реальный UUID
        let realItemId = item.itemId;
        if (item.itemType === 'trailer') {
          const { data: trailer } = await supabase
            .from('trailers')
            .select('id')
            .eq('slug', item.itemId)
            .single();
          
          if (trailer) {
            realItemId = trailer.id;
          }
        }
        
        // Получаем текущие остатки
        const { data: stock, error: stockError } = await supabase
          .from(tableName)
          .select('*')
          .eq(itemColumn, realItemId)
          .single();
        
        if (stockError || !stock) {
          console.warn(`Stock not found for ${item.itemType} ${item.itemId}`);
          continue;
        }
        
        // Проверяем доступность
        if (stock.available_quantity < item.quantity) {
          return {
            success: false,
            error: `Недостаточно остатков для ${item.itemType} ${item.itemId}. Доступно: ${stock.available_quantity}, запрошено: ${item.quantity}`,
          };
        }
        
        // Резервируем
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            available_quantity: stock.available_quantity - item.quantity,
            reserved_quantity: (stock.reserved_quantity || 0) + item.quantity,
            last_reservation_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', stock.id);
        
        if (updateError) {
          console.error(`Error reserving stock for ${item.itemType} ${item.itemId}:`, updateError);
          // Откатываем предыдущие резервирования
          for (const reserved of reservedItems) {
            await this.releaseStockItem?.(reserved.itemId, reserved.itemType as 'trailer' | 'option', reserved.quantity);
          }
          return {
            success: false,
            error: `Ошибка резервирования: ${updateError.message}`,
          };
        }
        
        reservedItems.push(item);
      }
      
      return {
        success: true,
        reservationId: orderId,
        itemsReserved: reservedItems,
      };
    } catch (err) {
      console.error('Error reserving stock:', err);
      return {
        success: false,
        error: 'Ошибка резервирования остатков',
      };
    }
  },

  /**
   * Освободить зарезервированные товары (при отмене заказа)
   * Увеличивает available_quantity, уменьшает reserved_quantity
   */
  async releaseStock(orderId: string) {
    try {
      // Получаем позиции заказа
      const { data: leadItems, error: itemsError } = await supabase
        .from('lead_items')
        .select('item_id, item_type, quantity')
        .eq('lead_id', orderId);
      
      if (itemsError || !leadItems) {
        return { success: false, error: 'Позиции заказа не найдены' };
      }
      
      for (const item of leadItems) {
        await this.releaseStockItem?.(
          item.item_id, 
          item.item_type === 'trailer' ? 'trailer' : 'option',
          item.quantity || 1
        );
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error releasing stock:', err);
      return { success: false, error: 'Ошибка освобождения остатков' };
    }
  },

  /**
   * Подтвердить списание (при выполнении заказа)
   * Уменьшает quantity и reserved_quantity
   */
  async commitStock(orderId: string) {
    try {
      // Получаем позиции заказа
      const { data: leadItems, error: itemsError } = await supabase
        .from('lead_items')
        .select('item_id, item_type, quantity')
        .eq('lead_id', orderId);
      
      if (itemsError || !leadItems) {
        return { success: false, error: 'Позиции заказа не найдены' };
      }
      
      for (const item of leadItems) {
        const tableName = item.item_type === 'trailer' ? 'trailer_stock' : 'option_stock';
        const itemColumn = item.item_type === 'trailer' ? 'trailer_id' : 'option_id';
        const qty = item.quantity || 1;
        
        // Получаем текущие остатки
        const { data: stock } = await supabase
          .from(tableName)
          .select('*')
          .eq(itemColumn, item.item_id)
          .single();
        
        if (stock) {
          // Списываем: уменьшаем quantity и reserved
          await supabase
            .from(tableName)
            .update({
              quantity: Math.max(0, stock.quantity - qty),
              reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - qty),
              updated_at: new Date().toISOString(),
            })
            .eq('id', stock.id);
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error committing stock:', err);
      return { success: false, error: 'Ошибка списания остатков' };
    }
  },

  /**
   * Вспомогательная функция для освобождения остатков одной позиции
   */
  async releaseStockItem(itemId: string, itemType: 'trailer' | 'option', quantity: number) {
    const tableName = itemType === 'trailer' ? 'trailer_stock' : 'option_stock';
    const itemColumn = itemType === 'trailer' ? 'trailer_id' : 'option_id';
    
    const { data: stock } = await supabase
      .from(tableName)
      .select('*')
      .eq(itemColumn, itemId)
      .single();
    
    if (stock) {
      await supabase
        .from(tableName)
        .update({
          available_quantity: stock.available_quantity + quantity,
          reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - quantity),
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id);
    }
  },

  // ========== VEHICLES ==========
  
  async getVehicles(): Promise<VehicleModel[]> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .order('popularity_score', { ascending: false });
      
    if (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      type: row.vehicle_type,
      brand: row.manufacturer,
      model: row.name,
      length: row.length_mm,
      width: row.width_mm,
      height: row.height_mm,
      weight: row.weight_kg,
      aliases: row.aliases,
      searchKeywords: row.search_keywords,
      popularityScore: row.popularity_score,
      imageUrl: row.image_url,
      description: row.description,
      foldedLength: row.folded_length_mm,
      foldedWidth: row.folded_width_mm,
      foldedHeight: row.folded_height_mm
    }));
  },

  async searchVehicles(query: string): Promise<VehicleModel[]> {
    const all = await this.getVehicles();
    const { searchVehicles: fuzzySearch } = await import('../../features/vehicles/vehicleSearch');
    return fuzzySearch(all, query).map(r => r.vehicle);
  },

  async importVehicles(data: VehicleDatabase): Promise<void> {
    const rows = data.vehicles.map(v => ({
      id: v.id,
      vehicle_type: v.type,
      manufacturer: v.brand,
      name: v.model,
      length_mm: v.length,
      width_mm: v.width,
      height_mm: v.height,
      weight_kg: v.weight,
      aliases: v.aliases,
      search_keywords: v.searchKeywords,
      popularity_score: v.popularityScore,
      image_url: v.imageUrl,
      description: v.description,
      folded_length_mm: v.foldedLength,
      folded_width_mm: v.foldedWidth,
      folded_height_mm: v.foldedHeight,
      data_version: data.version,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('vehicle_models')
      .upsert(rows);
      
    if (error) throw error;
  },

  async getVehiclesVersion(): Promise<number> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('data_version')
      .limit(1)
      .order('data_version', { ascending: false });
      
    if (error || !data || data.length === 0) return 0;
    return data[0].data_version || 0;
  },

  // ========== WAREHOUSES (Склады) ==========
  
  async getWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .order('priority', { ascending: false });
      
    if (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      code: row.code || '',
      name: row.name,
      city: row.address?.split(',')[0] || '', // Берём город из адреса
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      region: row.region || 'ХМАО',
      type: row.warehouse_type || 'retail',
      priceList: row.price_list || 'retail',
      priority: row.priority ?? 1,
      description: row.description || '',
      canShip: row.can_ship ?? true,
      workingHours: row.working_hours || '',
      isActive: row.status === 'active',
      order: row.sort_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },
  
  async getWarehouse(id: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return null;
    
    return {
      id: data.id,
      code: data.code || '',
      name: data.name,
      city: data.address?.split(',')[0] || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      region: data.region || 'ХМАО',
      type: data.warehouse_type || 'retail',
      priceList: data.price_list || 'retail',
      priority: data.priority ?? 1,
      description: data.description || '',
      canShip: data.can_ship ?? true,
      workingHours: data.working_hours || '',
      isActive: data.status === 'active',
      order: data.sort_order ?? 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
  
  async saveWarehouse(warehouse: Warehouse): Promise<Warehouse> {
    const row = {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      phone: warehouse.phone,
      email: warehouse.email,
      region: warehouse.region,
      warehouse_type: warehouse.type,
      price_list: warehouse.priceList,
      priority: warehouse.priority,
      description: warehouse.description,
      can_ship: warehouse.canShip,
      working_hours: warehouse.workingHours,
      status: warehouse.isActive ? 'active' : 'inactive',
      sort_order: warehouse.order,
    };
    
    const { data, error } = await supabase
      .from('warehouses')
      .upsert(row)
      .select()
      .single();
      
    if (error) throw error;
    return this.getWarehouse!(data.id) as Promise<Warehouse>;
  },
  
  async deleteWarehouse(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  },

  // ========== STOCK SUMMARY (Сводка остатков) ==========
  
  async getStockSummary(): Promise<StockSummary[]> {
    // Используем представление trailer_stock_summary
    const { data, error } = await supabase
      .from('trailer_stock_summary')
      .select('*');
      
    if (error) {
      console.error('Error fetching stock summary:', error);
      return [];
    }
    
    return data.map(row => ({
      productId: row.trailer_id,
      productType: 'trailer' as const,
      productName: row.trailer_name,
      productArticle: row.article,
      productImage: row.main_image_url,
      retailPrice: row.retail_price,
      category: row.category,
      totalQuantity: row.total_quantity || 0,
      totalReserved: row.total_reserved || 0,
      totalAvailable: row.total_available || 0,
      totalInTransit: row.total_in_transit || 0,
      byWarehouse: row.by_warehouse || {},
    }));
  },
  
  async getStockItems(warehouseId?: string): Promise<StockItem[]> {
    // Используем таблицу trailer_stock
    let query = supabase
      .from('trailer_stock')
      .select('*, trailers(name, article, main_image_url)');
      
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching stock items:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      trailerId: row.trailer_id,
      optionId: undefined,
      warehouseId: row.warehouse_id,
      quantity: row.available_quantity || 0,
      reserved: row.reserved_quantity || 0,
      inTransit: row.in_transit || 0,
      available: (row.available_quantity || 0) - (row.reserved_quantity || 0),
      minStock: row.min_stock || 0,
      lastCountedAt: row.last_counted_at,
    }));
  },
  
  async updateStockItem(stockItemId: string, updates: Partial<StockItem>): Promise<StockItem> {
    const row: any = {};
    if (updates.quantity !== undefined) row.available_quantity = updates.quantity;
    if (updates.reserved !== undefined) row.reserved_quantity = updates.reserved;
    if (updates.inTransit !== undefined) row.in_transit = updates.inTransit;
    if (updates.minStock !== undefined) row.min_stock = updates.minStock;
    if (updates.lastCountedAt !== undefined) row.last_counted_at = updates.lastCountedAt;
    
    const { data, error } = await supabase
      .from('trailer_stock')
      .update(row)
      .eq('id', stockItemId)
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      trailerId: data.trailer_id,
      optionId: undefined,
      warehouseId: data.warehouse_id,
      quantity: data.available_quantity || 0,
      reserved: data.reserved_quantity || 0,
      inTransit: data.in_transit || 0,
      available: (data.available_quantity || 0) - (data.reserved_quantity || 0),
      minStock: data.min_stock,
      lastCountedAt: data.last_counted_at,
    };
  },
  
  async setStockQuantity(
    trailerId: string | null,
    optionId: string | null,
    warehouseId: string,
    quantity: number
  ): Promise<void> {
    // Определяем таблицу и поля в зависимости от типа товара
    if (trailerId) {
      // Upsert остатка прицепа
      const { error } = await supabase
        .from('trailer_stock')
        .upsert({
          trailer_id: trailerId,
          warehouse_id: warehouseId,
          available_quantity: quantity,
          reserved_quantity: 0,
          in_transit: 0,
        }, {
          onConflict: 'trailer_id,warehouse_id'
        });
        
      if (error) throw error;
    } else if (optionId) {
      // Upsert остатка опции
      const { error } = await supabase
        .from('option_stock')
        .upsert({
          option_id: optionId,
          warehouse_id: warehouseId,
          available_quantity: quantity,
          reserved_quantity: 0,
          in_transit: 0,
        }, {
          onConflict: 'option_id,warehouse_id'
        });
        
      if (error) throw error;
    }
  },

  // ========== STOCK MOVEMENTS (Движения) ==========
  
  async getStockMovements(filters?: StockMovementFilters): Promise<StockMovement[]> {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (filters?.movementType) {
      query = query.eq('movement_type', filters.movementType);
    }
    if (filters?.warehouseId) {
      query = query.or(`from_warehouse_id.eq.${filters.warehouseId},to_warehouse_id.eq.${filters.warehouseId}`);
    }
    if (filters?.trailerId) {
      query = query.eq('trailer_id', filters.trailerId);
    }
    if (filters?.optionId) {
      query = query.eq('option_id', filters.optionId);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching stock movements:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      movementType: row.movement_type,
      trailerId: row.trailer_id,
      optionId: row.option_id,
      fromWarehouseId: row.from_warehouse_id,
      toWarehouseId: row.to_warehouse_id,
      quantity: row.quantity,
      previousQuantity: row.previous_quantity,
      newQuantity: row.new_quantity,
      documentNumber: row.document_number,
      reason: row.reason,
      leadId: row.lead_id,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
    }));
  },
  
  async createStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
    // 1. Получаем текущий остаток
    let currentQuantity = 0;
    const warehouseId = movement.movementType === 'shipment' 
      ? movement.fromWarehouseId 
      : movement.toWarehouseId;
      
    if (warehouseId && movement.trailerId) {
      const { data: stockData } = await supabase
        .from('trailer_stock')
        .select('available_quantity')
        .eq('warehouse_id', warehouseId)
        .eq('trailer_id', movement.trailerId)
        .single();
        
      currentQuantity = stockData?.available_quantity || 0;
    } else if (warehouseId && movement.optionId) {
      const { data: stockData } = await supabase
        .from('option_stock')
        .select('available_quantity')
        .eq('warehouse_id', warehouseId)
        .eq('option_id', movement.optionId)
        .single();
        
      currentQuantity = stockData?.available_quantity || 0;
    }
    
    // 2. Вычисляем новый остаток
    let newQuantity = currentQuantity;
    switch (movement.movementType) {
      case 'receipt':
      case 'adjustment':
        newQuantity = currentQuantity + movement.quantity;
        break;
      case 'shipment':
        newQuantity = Math.max(0, currentQuantity - movement.quantity);
        break;
      case 'transfer':
        // Для transfer обновляем оба склада
        break;
    }
    
    // 3. Создаём запись движения
    const row = {
      movement_type: movement.movementType,
      trailer_id: movement.trailerId,
      option_id: movement.optionId,
      from_warehouse_id: movement.fromWarehouseId,
      to_warehouse_id: movement.toWarehouseId,
      quantity: movement.quantity,
      previous_quantity: currentQuantity,
      new_quantity: newQuantity,
      document_number: movement.documentNumber,
      reason: movement.reason,
      lead_id: movement.leadId,
      created_by: movement.createdBy,
      created_by_name: movement.createdByName,
    };
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(row)
      .select()
      .single();
      
    if (error) throw error;
    
    // 4. Обновляем остатки
    if (movement.movementType === 'transfer') {
      // Уменьшаем на складе отправителя
      if (movement.fromWarehouseId) {
        if (movement.trailerId) {
          await supabase.rpc('update_trailer_stock_quantity', {
            p_trailer_id: movement.trailerId,
            p_warehouse_id: movement.fromWarehouseId,
            p_delta: -movement.quantity
          });
        } else if (movement.optionId) {
          await supabase.rpc('update_option_stock_quantity', {
            p_option_id: movement.optionId,
            p_warehouse_id: movement.fromWarehouseId,
            p_delta: -movement.quantity
          });
        }
      }
      // Увеличиваем на складе получателя
      if (movement.toWarehouseId) {
        if (movement.trailerId) {
          await supabase.rpc('update_trailer_stock_quantity', {
            p_trailer_id: movement.trailerId,
            p_warehouse_id: movement.toWarehouseId,
            p_delta: movement.quantity
          });
        } else if (movement.optionId) {
          await supabase.rpc('update_option_stock_quantity', {
            p_option_id: movement.optionId,
            p_warehouse_id: movement.toWarehouseId,
            p_delta: movement.quantity
          });
        }
      }
    } else {
      // Для остальных типов обновляем один склад
      const delta = movement.movementType === 'shipment' ? -movement.quantity : movement.quantity;
      if (movement.trailerId) {
        await supabase.rpc('update_trailer_stock_quantity', {
          p_trailer_id: movement.trailerId,
          p_warehouse_id: warehouseId,
          p_delta: delta
        });
      } else if (movement.optionId) {
        await supabase.rpc('update_option_stock_quantity', {
          p_option_id: movement.optionId,
          p_warehouse_id: warehouseId,
          p_delta: delta
        });
      }
    }
    
    return {
      id: data.id,
      movementType: data.movement_type,
      trailerId: data.trailer_id,
      optionId: data.option_id,
      fromWarehouseId: data.from_warehouse_id,
      toWarehouseId: data.to_warehouse_id,
      quantity: data.quantity,
      previousQuantity: data.previous_quantity,
      newQuantity: data.new_quantity,
      documentNumber: data.document_number,
      reason: data.reason,
      leadId: data.lead_id,
      createdBy: data.created_by,
      createdByName: data.created_by_name,
      createdAt: data.created_at,
    };
  },

  // ========== INIT ==========
  async initializeData(): Promise<void> {
    // Данные уже в Supabase, инициализация не нужна
  },
};

export default SupabaseProvider;
