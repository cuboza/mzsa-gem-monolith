/**
 * Импорт данных из 1С в Supabase
 * 
 * Поддерживаемые форматы:
 * - JSON (выгрузка из 1С через CommerceML или кастомный обработчик)
 * - CSV (табличный экспорт)
 * 
 * Формат JSON (ожидаемый):
 * {
 *   "trailers": [{
 *     "guid_1c": "...",
 *     "model": "МЗСА 817700.002",
 *     "name": "Прицеп КОМПАКТ",
 *     "article": "817700.002",
 *     "base_price": 120000,
 *     "retail_price": 130000,
 *     "category": "general",
 *     "description": "...",
 *     "specs": { ... },
 *     "images": ["url1", "url2"],
 *     "stock": { "SG-1": 2, "NV": 1 }
 *   }],
 *   "options": [{
 *     "guid_1c": "...",
 *     "name": "Тент плоский",
 *     "article": "...",
 *     "retail_price": 15000,
 *     "category": "cover",
 *     "compatible_trailers": ["guid1", "guid2"]
 *   }],
 *   "warehouses": [{
 *     "guid_1c": "...",
 *     "code": "SG-1",
 *     "name": "Склад Сургут основной",
 *     "city": "Сургут",
 *     "address": "пр-т Мира, 55"
 *   }]
 * }
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// ТИПЫ
// ============================================================================

interface Import1CTrailer {
  guid_1c: string;
  model: string;
  name: string;
  article?: string;
  description?: string;
  short_description?: string;
  category: string; // slug категории: general, water, commercial
  execution?: string;
  base_price?: number;
  retail_price?: number;
  wholesale_price?: number;
  availability?: 'in_stock' | 'on_order' | 'out_of_stock';
  delivery_days?: number;
  main_image_url?: string;
  images?: string[];
  badges?: string[];
  specs?: Record<string, string | number>;
  features?: string[];
  stock?: Record<string, number>; // warehouse_code -> quantity
  max_vehicle_length?: number;
  max_vehicle_width?: number;
  max_vehicle_weight?: number;
  compatibility?: string[];
}

interface Import1COption {
  guid_1c: string;
  name: string;
  article?: string;
  description?: string;
  category: string;
  base_price?: number;
  retail_price?: number;
  availability?: 'in_stock' | 'on_order' | 'out_of_stock';
  main_image_url?: string;
  images?: string[];
  compatible_trailers?: string[]; // массив guid_1c прицепов
  stock?: Record<string, number>;
}

interface Import1CWarehouse {
  guid_1c: string;
  code: string;
  name: string;
  city?: string;
  address?: string;
  warehouse_type?: 'retail' | 'wholesale' | 'service' | 'transit';
  latitude?: number;
  longitude?: number;
  is_main?: boolean;
}

interface Import1CData {
  trailers?: Import1CTrailer[];
  options?: Import1COption[];
  warehouses?: Import1CWarehouse[];
  _meta?: {
    export_date: string;
    source: string;
    version: string;
  };
}

interface ImportResult {
  success: boolean;
  imported: {
    trailers: number;
    options: number;
    warehouses: number;
    stock: number;
    trailer_options: number;
  };
  errors: string[];
  warnings: string[];
}

interface ImportOptions {
  mode: 'full' | 'update' | 'stock_only';
  clearBefore?: boolean;
  dryRun?: boolean;
}

// ============================================================================
// МАППИНГИ
// ============================================================================

const CATEGORY_MAP: Record<string, string> = {
  'universal': 'general',
  'universalnye': 'general',
  'универсальные': 'general',
  'бортовые': 'general',
  'lodochnye': 'water',
  'лодочные': 'water',
  'water': 'water',
  'commercial': 'commercial',
  'коммерческие': 'commercial',
  'furgon': 'commercial',
  'фургон': 'commercial',
};

const SPEC_LABELS: Record<string, { label: string; unit: string }> = {
  'polnaya_massa': { label: 'Полная масса', unit: 'кг' },
  'груз': { label: 'Грузоподъёмность', unit: 'кг' },
  'gruzopodemnost': { label: 'Грузоподъёмность', unit: 'кг' },
  'snaryazhyonnaya_massa': { label: 'Снаряжённая масса', unit: 'кг' },
  'curb_weight': { label: 'Снаряжённая масса', unit: 'кг' },
  'gabaritnye_razmery': { label: 'Габаритные размеры', unit: '' },
  'dimensions': { label: 'Габаритные размеры', unit: '' },
  'vnutrennie_razmery': { label: 'Внутренние размеры кузова', unit: '' },
  'body_dimensions': { label: 'Размеры кузова', unit: '' },
  'vysota_bortov': { label: 'Высота бортов', unit: 'мм' },
  'board_height': { label: 'Высота бортов', unit: 'мм' },
  'kolichestvo_osey': { label: 'Количество осей', unit: '' },
  'axles': { label: 'Количество осей', unit: '' },
  'tip_podveski': { label: 'Тип подвески', unit: '' },
  'suspension': { label: 'Тип подвески', unit: '' },
  'tormoza': { label: 'Тормозная система', unit: '' },
  'brakes': { label: 'Тормозная система', unit: '' },
  'max_sudno': { label: 'Макс. длина судна', unit: 'мм' },
  'max_boat_length': { label: 'Макс. длина судна', unit: 'мм' },
};

// ============================================================================
// ИМПОРТЁР
// ============================================================================

export class Importer1C {
  private supabase: SupabaseClient;
  private categoryMap: Map<string, string> = new Map();
  private warehouseMap: Map<string, string> = new Map();
  private trailerGuidMap: Map<string, string> = new Map();
  
  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Основной метод импорта
   */
  async import(data: Import1CData, options: ImportOptions = { mode: 'update' }): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: { trailers: 0, options: 0, warehouses: 0, stock: 0, trailer_options: 0 },
      errors: [],
      warnings: [],
    };

    try {
      console.log('📦 Начинаем импорт из 1С...');
      console.log(`   Режим: ${options.mode}, dryRun: ${options.dryRun || false}`);

      // Загружаем справочники
      await this.loadCategories();
      
      // Импорт складов (сначала, т.к. они нужны для остатков)
      if (data.warehouses && data.warehouses.length > 0) {
        const whResult = await this.importWarehouses(data.warehouses, options);
        result.imported.warehouses = whResult.count;
        result.errors.push(...whResult.errors);
      }
      
      await this.loadWarehouses();

      // Импорт прицепов
      if (data.trailers && data.trailers.length > 0) {
        const trResult = await this.importTrailers(data.trailers, options);
        result.imported.trailers = trResult.count;
        result.imported.stock += trResult.stockCount;
        result.errors.push(...trResult.errors);
        result.warnings.push(...trResult.warnings);
      }

      // Импорт опций
      if (data.options && data.options.length > 0) {
        const optResult = await this.importOptions(data.options, options);
        result.imported.options = optResult.count;
        result.imported.trailer_options = optResult.relationsCount;
        result.imported.stock += optResult.stockCount;
        result.errors.push(...optResult.errors);
      }

      result.success = result.errors.length === 0;
      
      console.log('\n✅ Импорт завершён');
      console.log(`   Прицепов: ${result.imported.trailers}`);
      console.log(`   Опций: ${result.imported.options}`);
      console.log(`   Складов: ${result.imported.warehouses}`);
      console.log(`   Связей прицеп-опция: ${result.imported.trailer_options}`);
      console.log(`   Остатков: ${result.imported.stock}`);
      if (result.errors.length > 0) {
        console.log(`   ⚠️ Ошибок: ${result.errors.length}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Критическая ошибка: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Загрузка категорий из БД
   */
  private async loadCategories(): Promise<void> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('id, slug')
      .eq('status', 'active');
    
    if (error) throw new Error(`Ошибка загрузки категорий: ${error.message}`);
    
    data?.forEach(cat => {
      this.categoryMap.set(cat.slug, cat.id);
    });
    
    console.log(`   Загружено категорий: ${this.categoryMap.size}`);
  }

  /**
   * Загрузка складов из БД
   */
  private async loadWarehouses(): Promise<void> {
    const { data, error } = await this.supabase
      .from('warehouses')
      .select('id, code, guid_1c');
    
    if (error) throw new Error(`Ошибка загрузки складов: ${error.message}`);
    
    data?.forEach(wh => {
      if (wh.code) this.warehouseMap.set(wh.code, wh.id);
      if (wh.guid_1c) this.warehouseMap.set(wh.guid_1c, wh.id);
    });
    
    console.log(`   Загружено складов: ${this.warehouseMap.size}`);
  }

  /**
   * Импорт складов
   */
  private async importWarehouses(
    warehouses: Import1CWarehouse[],
    options: ImportOptions
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    for (const wh of warehouses) {
      try {
        const warehouseData = {
          guid_1c: wh.guid_1c,
          code: wh.code,
          name: wh.name,
          address: wh.address,
          latitude: wh.latitude,
          longitude: wh.longitude,
          warehouse_type: wh.warehouse_type || 'retail',
          is_main: wh.is_main || false,
          status: 'active',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        if (options.dryRun) {
          console.log(`   [DRY RUN] Склад: ${wh.name}`);
          count++;
          continue;
        }

        const { error } = await this.supabase
          .from('warehouses')
          .upsert(warehouseData, { onConflict: 'guid_1c' });

        if (error) {
          errors.push(`Склад ${wh.code}: ${error.message}`);
        } else {
          count++;
        }
      } catch (e) {
        errors.push(`Склад ${wh.code}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(`   Импортировано складов: ${count}`);
    return { count, errors };
  }

  /**
   * Импорт прицепов
   */
  private async importTrailers(
    trailers: Import1CTrailer[],
    options: ImportOptions
  ): Promise<{ count: number; stockCount: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let count = 0;
    let stockCount = 0;

    for (const trailer of trailers) {
      try {
        // Нормализация категории
        const categorySlug = CATEGORY_MAP[trailer.category.toLowerCase()] || trailer.category;
        const categoryId = this.categoryMap.get(categorySlug);
        
        if (!categoryId) {
          warnings.push(`Прицеп ${trailer.model}: категория "${trailer.category}" не найдена`);
        }

        const trailerData = {
          guid_1c: trailer.guid_1c,
          model: trailer.model,
          name: trailer.name,
          full_name: `${trailer.model} - ${trailer.name}`,
          article: trailer.article,
          description: trailer.description,
          short_description: trailer.short_description,
          category_id: categoryId,
          execution: trailer.execution,
          base_price: trailer.base_price,
          retail_price: trailer.retail_price || trailer.base_price,
          wholesale_price: trailer.wholesale_price,
          availability: trailer.availability || 'in_stock',
          delivery_days: trailer.delivery_days || 0,
          main_image_url: trailer.main_image_url || trailer.images?.[0],
          thumbnail_url: trailer.main_image_url || trailer.images?.[0],
          badges: trailer.badges || [],
          status: 'active',
          visible_on_site: true,
          is_published: true,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        if (options.dryRun) {
          console.log(`   [DRY RUN] Прицеп: ${trailer.model}`);
          count++;
          continue;
        }

        // Upsert прицепа
        const { data: upsertedTrailer, error } = await this.supabase
          .from('trailers')
          .upsert(trailerData, { onConflict: 'guid_1c' })
          .select('id')
          .single();

        if (error) {
          errors.push(`Прицеп ${trailer.model}: ${error.message}`);
          continue;
        }

        const trailerId = upsertedTrailer.id;
        this.trailerGuidMap.set(trailer.guid_1c, trailerId);
        count++;

        // Импорт изображений
        if (trailer.images && trailer.images.length > 0) {
          await this.importTrailerImages(trailerId, trailer.images);
        }

        // Импорт характеристик
        if (trailer.specs) {
          await this.importTrailerSpecs(trailerId, trailer.specs);
        }

        // Импорт features
        if (trailer.features && trailer.features.length > 0) {
          await this.importTrailerFeatures(trailerId, trailer.features);
        }

        // Импорт остатков
        if (trailer.stock && options.mode !== 'stock_only') {
          const stockImported = await this.importStock('trailer', trailerId, trailer.stock);
          stockCount += stockImported;
        }

      } catch (e) {
        errors.push(`Прицеп ${trailer.model}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(`   Импортировано прицепов: ${count}`);
    return { count, stockCount, errors, warnings };
  }

  /**
   * Импорт изображений прицепа
   */
  private async importTrailerImages(trailerId: string, images: string[]): Promise<void> {
    // Удаляем старые
    await this.supabase
      .from('images')
      .delete()
      .eq('item_id', trailerId)
      .eq('item_type', 'trailer');

    // Добавляем новые
    const imageRecords = images.map((url, index) => ({
      item_id: trailerId,
      item_type: 'trailer',
      url,
      type: index === 0 ? 'main' : 'gallery',
      display_order: index,
    }));

    await this.supabase.from('images').insert(imageRecords);
  }

  /**
   * Импорт характеристик прицепа
   */
  private async importTrailerSpecs(trailerId: string, specs: Record<string, string | number>): Promise<void> {
    // Удаляем старые
    await this.supabase
      .from('specifications')
      .delete()
      .eq('trailer_id', trailerId);

    const specRecords: any[] = [];
    let order = 0;

    for (const [key, value] of Object.entries(specs)) {
      const specInfo = SPEC_LABELS[key] || { label: key, unit: '' };
      
      specRecords.push({
        trailer_id: trailerId,
        key,
        label: specInfo.label,
        value_text: String(value),
        value_numeric: typeof value === 'number' ? value : null,
        unit: specInfo.unit,
        display_order: order++,
        is_filterable: true,
        is_comparable: true,
      });
    }

    if (specRecords.length > 0) {
      await this.supabase.from('specifications').insert(specRecords);
    }
  }

  /**
   * Импорт features прицепа
   */
  private async importTrailerFeatures(trailerId: string, features: string[]): Promise<void> {
    // Удаляем старые
    await this.supabase
      .from('features')
      .delete()
      .eq('trailer_id', trailerId);

    const featureRecords = features.map((text, index) => ({
      trailer_id: trailerId,
      text,
      display_order: index,
    }));

    if (featureRecords.length > 0) {
      await this.supabase.from('features').insert(featureRecords);
    }
  }

  /**
   * Импорт опций
   */
  private async importOptions(
    options1C: Import1COption[],
    importOptions: ImportOptions
  ): Promise<{ count: number; stockCount: number; relationsCount: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;
    let stockCount = 0;
    let relationsCount = 0;

    for (const opt of options1C) {
      try {
        const optionData = {
          guid_1c: opt.guid_1c,
          name: opt.name,
          full_name: opt.name,
          article: opt.article,
          description: opt.description,
          option_category: opt.category,
          base_price: opt.base_price,
          retail_price: opt.retail_price || opt.base_price,
          availability: opt.availability || 'in_stock',
          main_image_url: opt.main_image_url || opt.images?.[0],
          status: 'active',
          visible_on_site: true,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        if (importOptions.dryRun) {
          console.log(`   [DRY RUN] Опция: ${opt.name}`);
          count++;
          continue;
        }

        // Upsert опции
        const { data: upsertedOption, error } = await this.supabase
          .from('options')
          .upsert(optionData, { onConflict: 'guid_1c' })
          .select('id')
          .single();

        if (error) {
          errors.push(`Опция ${opt.name}: ${error.message}`);
          continue;
        }

        const optionId = upsertedOption.id;
        count++;

        // Связи с прицепами
        if (opt.compatible_trailers && opt.compatible_trailers.length > 0) {
          // Удаляем старые связи
          await this.supabase
            .from('trailer_options')
            .delete()
            .eq('option_id', optionId);

          const relations: any[] = [];
          for (const trailerGuid of opt.compatible_trailers) {
            const trailerId = this.trailerGuidMap.get(trailerGuid);
            if (trailerId) {
              relations.push({
                trailer_id: trailerId,
                option_id: optionId,
                is_default: false,
                is_required: false,
              });
            }
          }

          if (relations.length > 0) {
            await this.supabase.from('trailer_options').insert(relations);
            relationsCount += relations.length;
          }
        }

        // Остатки
        if (opt.stock) {
          const stockImported = await this.importStock('option', optionId, opt.stock);
          stockCount += stockImported;
        }

      } catch (e) {
        errors.push(`Опция ${opt.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(`   Импортировано опций: ${count}`);
    return { count, stockCount, relationsCount, errors };
  }

  /**
   * Импорт остатков
   */
  private async importStock(
    itemType: 'trailer' | 'option',
    itemId: string,
    stock: Record<string, number>
  ): Promise<number> {
    let count = 0;

    for (const [warehouseCode, quantity] of Object.entries(stock)) {
      const warehouseId = this.warehouseMap.get(warehouseCode);
      if (!warehouseId) continue;

      const stockData = {
        item_type: itemType,
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity,
        updated_at: new Date().toISOString(),
      };

      // Попытка upsert (если таблица stock_levels существует)
      try {
        await this.supabase
          .from('stock_levels')
          .upsert(stockData, { onConflict: 'item_type,item_id,warehouse_id' });
        count++;
      } catch {
        // Если таблицы нет, пропускаем
      }
    }

    return count;
  }

  /**
   * Импорт только остатков (быстрый режим)
   */
  async importStockOnly(stockData: Record<string, Record<string, number>>): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: { trailers: 0, options: 0, warehouses: 0, stock: 0, trailer_options: 0 },
      errors: [],
      warnings: [],
    };

    await this.loadWarehouses();

    // Загружаем guid_1c -> id маппинг для прицепов
    const { data: trailers } = await this.supabase
      .from('trailers')
      .select('id, guid_1c');
    
    trailers?.forEach(t => {
      if (t.guid_1c) this.trailerGuidMap.set(t.guid_1c, t.id);
    });

    for (const [guid1c, stock] of Object.entries(stockData)) {
      const itemId = this.trailerGuidMap.get(guid1c);
      if (itemId) {
        result.imported.stock += await this.importStock('trailer', itemId, stock);
      }
    }

    return result;
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  const fileArg = args.find(a => a.startsWith('--file='));
  const modeArg = args.find(a => a.startsWith('--mode='));
  const dryRun = args.includes('--dry-run');
  
  if (!fileArg) {
    console.log(`
📦 Импорт данных из 1С в Supabase

Использование:
  npx ts-node scripts/import_from_1c.ts --file=path/to/export.json [опции]

Опции:
  --file=<path>     Путь к JSON-файлу с данными из 1С (обязательно)
  --mode=<mode>     Режим импорта: full | update | stock_only (по умолчанию: update)
  --dry-run         Тестовый запуск без записи в БД

Переменные окружения:
  SUPABASE_URL          URL Supabase проекта
  SUPABASE_SERVICE_KEY  Service role key для полного доступа

Пример JSON:
{
  "trailers": [{ "guid_1c": "...", "model": "МЗСА 817700.002", ... }],
  "options": [{ "guid_1c": "...", "name": "Тент плоский", ... }],
  "warehouses": [{ "guid_1c": "...", "code": "SG-1", ... }]
}
`);
    process.exit(1);
  }

  const filePath = fileArg.split('=')[1];
  const mode = (modeArg?.split('=')[1] || 'update') as 'full' | 'update' | 'stock_only';

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл не найден: ${filePath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseKey) {
    console.error('❌ Установите SUPABASE_SERVICE_KEY в переменных окружения');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Import1CData;
  
  console.log(`📄 Загружен файл: ${filePath}`);
  console.log(`   Прицепов: ${data.trailers?.length || 0}`);
  console.log(`   Опций: ${data.options?.length || 0}`);
  console.log(`   Складов: ${data.warehouses?.length || 0}`);

  const importer = new Importer1C(supabaseUrl, supabaseKey);
  const result = await importer.import(data, { mode, dryRun });

  if (!result.success) {
    console.error('\n❌ Импорт завершён с ошибками:');
    result.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ Предупреждения:');
    result.warnings.forEach(w => console.log(`   - ${w}`));
  }
}

main().catch(console.error);
