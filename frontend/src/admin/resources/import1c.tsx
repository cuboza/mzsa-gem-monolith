/**
 * Интерфейс импорта данных из 1С
 * 
 * Позволяет администратору:
 * - Загрузить JSON-файл экспорта из 1С
 * - Просмотреть превью данных
 * - Выбрать режим импорта
 * - Запустить импорт в Supabase
 * - Просмотреть результаты и логи
 */

import React, { useState, useCallback } from 'react';
import { Title, useNotify, useRefresh } from 'react-admin';
import {
  Upload,
  FileJson,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Wrench,
  Warehouse,
  RefreshCw,
  Eye,
  Play,
  Trash2,
  Download,
  Clock,
} from 'lucide-react';
import { supabase } from '../../services/api/supabaseClient';

// ============================================================================
// ТИПЫ
// ============================================================================

interface Import1CData {
  trailers?: Array<{
    guid_1c: string;
    model: string;
    name: string;
    article?: string;
    description?: string;
    category: string;
    base_price?: number;
    retail_price?: number;
    availability?: string;
    images?: string[];
    specs?: Record<string, unknown>;
    features?: string[];
    stock?: Record<string, number>;
    max_vehicle_length?: number;
    max_vehicle_width?: number;
    max_vehicle_weight?: number;
    compatibility?: string[];
  }>;
  options?: Array<{
    guid_1c: string;
    name: string;
    article?: string;
    description?: string;
    category: string;
    retail_price?: number;
    images?: string[];
    compatible_trailers?: string[];
    stock?: Record<string, number>;
  }>;
  warehouses?: Array<{
    guid_1c: string;
    code: string;
    name: string;
    city?: string;
    address?: string;
    warehouse_type?: string;
  }>;
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
  };
  errors: string[];
  warnings: string[];
  timestamp: string;
}

interface ImportLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

type ImportMode = 'update' | 'full' | 'stock_only';

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
  'general': 'general',
};

// ============================================================================
// КОМПОНЕНТ
// ============================================================================

export const Import1CAdmin: React.FC = () => {
  const notify = useNotify();
  const refresh = useRefresh();

  // Состояния
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Import1CData | null>(null);
  const [mode, setMode] = useState<ImportMode>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Добавление записи в лог
  const addLog = useCallback((type: ImportLogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
    }]);
  }, []);

  // Загрузка файла
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLogs([]);
    setResult(null);
    setIsLoading(true);

    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text) as Import1CData;
      setData(parsed);
      
      addLog('info', `Файл загружен: ${selectedFile.name}`);
      addLog('info', `Размер: ${(selectedFile.size / 1024).toFixed(2)} KB`);
      
      if (parsed.trailers?.length) {
        addLog('success', `Найдено прицепов: ${parsed.trailers.length}`);
      }
      if (parsed.options?.length) {
        addLog('success', `Найдено опций: ${parsed.options.length}`);
      }
      if (parsed.warehouses?.length) {
        addLog('success', `Найдено складов: ${parsed.warehouses.length}`);
      }
      if (parsed._meta) {
        addLog('info', `Дата выгрузки: ${parsed._meta.export_date}`);
      }
      
    } catch (error) {
      addLog('error', `Ошибка парсинга: ${error instanceof Error ? error.message : 'Неверный формат'}`);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  // Сброс формы
  const handleReset = useCallback(() => {
    setFile(null);
    setData(null);
    setLogs([]);
    setResult(null);
    setShowPreview(false);
  }, []);

  // Загрузка справочников из БД
  const loadReferences = useCallback(async () => {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('status', 'active');
    
    const { data: warehouses } = await supabase
      .from('warehouses')
      .select('id, code, guid_1c');
    
    const categoryMap = new Map<string, string>();
    categories?.forEach(c => categoryMap.set(c.slug, c.id));
    
    const warehouseMap = new Map<string, string>();
    warehouses?.forEach(w => {
      if (w.code) warehouseMap.set(w.code, w.id);
      if (w.guid_1c) warehouseMap.set(w.guid_1c, w.id);
    });
    
    return { categoryMap, warehouseMap };
  }, []);

  // Импорт прицепов
  const importTrailers = useCallback(async (
    trailers: NonNullable<Import1CData['trailers']>,
    categoryMap: Map<string, string>
  ): Promise<{ count: number; errors: string[]; trailerGuidMap: Map<string, string> }> => {
    const errors: string[] = [];
    const trailerGuidMap = new Map<string, string>();
    let count = 0;

    for (const trailer of trailers) {
      try {
        const categorySlug = CATEGORY_MAP[trailer.category.toLowerCase()] || trailer.category;
        const categoryId = categoryMap.get(categorySlug);

        if (!categoryId) {
          errors.push(`Прицеп ${trailer.model}: категория "${trailer.category}" не найдена`);
        }

        const trailerData = {
          guid_1c: trailer.guid_1c,
          model: trailer.model,
          name: trailer.name,
          full_name: `${trailer.model} - ${trailer.name}`,
          article: trailer.article,
          description: trailer.description,
          category_id: categoryId,
          base_price: trailer.base_price,
          retail_price: trailer.retail_price || trailer.base_price,
          availability: trailer.availability || 'in_stock',
          main_image_url: trailer.images?.[0],
          max_vehicle_length: trailer.max_vehicle_length,
          max_vehicle_width: trailer.max_vehicle_width,
          max_vehicle_weight: trailer.max_vehicle_weight,
          compatibility: trailer.compatibility || [],
          status: 'active',
          visible_on_site: true,
          is_published: true,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        const { data: upserted, error } = await supabase
          .from('trailers')
          .upsert(trailerData, { onConflict: 'guid_1c' })
          .select('id')
          .single();

        if (error) {
          errors.push(`Прицеп ${trailer.model}: ${error.message}`);
          continue;
        }

        trailerGuidMap.set(trailer.guid_1c, upserted.id);
        count++;

        // Импорт изображений
        if (trailer.images && trailer.images.length > 0) {
          await supabase
            .from('images')
            .delete()
            .eq('item_id', upserted.id)
            .eq('item_type', 'trailer');

          const imageRecords = trailer.images.map((url, idx) => ({
            item_id: upserted.id,
            item_type: 'trailer',
            url,
            type: idx === 0 ? 'main' : 'gallery',
            display_order: idx,
          }));

          await supabase.from('images').insert(imageRecords);
        }

        // Импорт характеристик
        if (trailer.specs) {
          await supabase
            .from('specifications')
            .delete()
            .eq('trailer_id', upserted.id);

          const specRecords = Object.entries(trailer.specs).map(([key, value], idx) => ({
            trailer_id: upserted.id,
            key,
            label: key,
            value_text: String(value),
            value_numeric: typeof value === 'number' ? value : null,
            display_order: idx,
          }));

          if (specRecords.length > 0) {
            await supabase.from('specifications').insert(specRecords);
          }
        }

        // Импорт features
        if (trailer.features && trailer.features.length > 0) {
          await supabase
            .from('features')
            .delete()
            .eq('trailer_id', upserted.id);

          const featureRecords = trailer.features.map((text, idx) => ({
            trailer_id: upserted.id,
            text,
            display_order: idx,
          }));

          await supabase.from('features').insert(featureRecords);
        }

      } catch (e) {
        errors.push(`Прицеп ${trailer.model}: ${e instanceof Error ? e.message : 'Ошибка'}`);
      }
    }

    return { count, errors, trailerGuidMap };
  }, []);

  // Импорт опций
  const importOptions = useCallback(async (
    options: NonNullable<Import1CData['options']>,
    trailerGuidMap: Map<string, string>
  ): Promise<{ count: number; relationsCount: number; errors: string[] }> => {
    const errors: string[] = [];
    let count = 0;
    let relationsCount = 0;

    for (const opt of options) {
      try {
        const optionData = {
          guid_1c: opt.guid_1c,
          name: opt.name,
          full_name: opt.name,
          article: opt.article,
          description: opt.description,
          option_category: opt.category,
          retail_price: opt.retail_price,
          main_image_url: opt.images?.[0],
          status: 'active',
          visible_on_site: true,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        const { data: upserted, error } = await supabase
          .from('options')
          .upsert(optionData, { onConflict: 'guid_1c' })
          .select('id')
          .single();

        if (error) {
          errors.push(`Опция ${opt.name}: ${error.message}`);
          continue;
        }

        count++;

        // Связи с прицепами
        if (opt.compatible_trailers && opt.compatible_trailers.length > 0) {
          await supabase
            .from('trailer_options')
            .delete()
            .eq('option_id', upserted.id);

          const relations: Array<{ trailer_id: string; option_id: string }> = [];
          for (const guid of opt.compatible_trailers) {
            const trailerId = trailerGuidMap.get(guid);
            if (trailerId) {
              relations.push({
                trailer_id: trailerId,
                option_id: upserted.id,
              });
            }
          }

          if (relations.length > 0) {
            await supabase.from('trailer_options').insert(relations);
            relationsCount += relations.length;
          }
        }

      } catch (e) {
        errors.push(`Опция ${opt.name}: ${e instanceof Error ? e.message : 'Ошибка'}`);
      }
    }

    return { count, relationsCount, errors };
  }, []);

  // Импорт складов
  const importWarehouses = useCallback(async (
    warehouses: NonNullable<Import1CData['warehouses']>
  ): Promise<{ count: number; errors: string[] }> => {
    const errors: string[] = [];
    let count = 0;

    for (const wh of warehouses) {
      try {
        const warehouseData = {
          guid_1c: wh.guid_1c,
          code: wh.code,
          name: wh.name,
          address: wh.address,
          warehouse_type: wh.warehouse_type || 'retail',
          status: 'active',
          sync_status: 'synced',
          last_sync_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('warehouses')
          .upsert(warehouseData, { onConflict: 'guid_1c' });

        if (error) {
          errors.push(`Склад ${wh.code}: ${error.message}`);
        } else {
          count++;
        }
      } catch (e) {
        errors.push(`Склад ${wh.code}: ${e instanceof Error ? e.message : 'Ошибка'}`);
      }
    }

    return { count, errors };
  }, []);

  // Основной импорт
  const handleImport = useCallback(async () => {
    if (!data) return;

    setIsImporting(true);
    setResult(null);
    addLog('info', `Начинаем импорт в режиме "${mode}"...`);

    const importResult: ImportResult = {
      success: true,
      imported: { trailers: 0, options: 0, warehouses: 0, stock: 0 },
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString(),
    };

    try {
      const { categoryMap } = await loadReferences();
      addLog('info', `Загружено категорий: ${categoryMap.size}`);

      let trailerGuidMap = new Map<string, string>();

      // Импорт складов
      if (data.warehouses && data.warehouses.length > 0 && mode !== 'stock_only') {
        addLog('info', `Импорт складов (${data.warehouses.length})...`);
        const whResult = await importWarehouses(data.warehouses);
        importResult.imported.warehouses = whResult.count;
        importResult.errors.push(...whResult.errors);
        addLog(whResult.errors.length ? 'warning' : 'success', 
          `Склады: ${whResult.count} импортировано, ${whResult.errors.length} ошибок`);
      }

      // Импорт прицепов
      if (data.trailers && data.trailers.length > 0) {
        addLog('info', `Импорт прицепов (${data.trailers.length})...`);
        const trResult = await importTrailers(data.trailers, categoryMap);
        importResult.imported.trailers = trResult.count;
        trailerGuidMap = trResult.trailerGuidMap;
        importResult.errors.push(...trResult.errors);
        addLog(trResult.errors.length ? 'warning' : 'success',
          `Прицепы: ${trResult.count} импортировано, ${trResult.errors.length} ошибок`);
      }

      // Импорт опций
      if (data.options && data.options.length > 0 && mode !== 'stock_only') {
        addLog('info', `Импорт опций (${data.options.length})...`);
        const optResult = await importOptions(data.options, trailerGuidMap);
        importResult.imported.options = optResult.count;
        importResult.errors.push(...optResult.errors);
        addLog(optResult.errors.length ? 'warning' : 'success',
          `Опции: ${optResult.count} импортировано, ${optResult.relationsCount} связей, ${optResult.errors.length} ошибок`);
      }

      importResult.success = importResult.errors.length === 0;

      if (importResult.success) {
        addLog('success', '✅ Импорт успешно завершён!');
        notify('Импорт успешно завершён', { type: 'success' });
      } else {
        addLog('warning', `⚠️ Импорт завершён с ${importResult.errors.length} ошибками`);
        notify(`Импорт завершён с ${importResult.errors.length} ошибками`, { type: 'warning' });
      }

      setResult(importResult);
      setLastImport(importResult.timestamp);
      refresh();

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      importResult.success = false;
      importResult.errors.push(errorMsg);
      addLog('error', `❌ Критическая ошибка: ${errorMsg}`);
      notify(`Ошибка импорта: ${errorMsg}`, { type: 'error' });
      setResult(importResult);
    } finally {
      setIsImporting(false);
    }
  }, [data, mode, loadReferences, importWarehouses, importTrailers, importOptions, addLog, notify, refresh]);

  // Скачать шаблон
  const handleDownloadTemplate = useCallback(() => {
    const template: Import1CData = {
      _meta: {
        export_date: new Date().toISOString(),
        source: '1C:Enterprise',
        version: '1.0',
      },
      trailers: [{
        guid_1c: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        model: 'МЗСА 817700.002',
        name: 'Прицеп КОМПАКТ',
        article: '817700.002',
        category: 'general',
        description: 'Универсальный прицеп для легковых автомобилей',
        base_price: 120000,
        retail_price: 130000,
        availability: 'in_stock',
        images: ['https://example.com/image1.jpg'],
        specs: {
          polnaya_massa: 750,
          gruzopodemnost: 450,
          gabaritnye_razmery: '2050×1100×1500',
        },
        features: ['Оцинкованный кузов', 'Откидной задний борт'],
        max_vehicle_length: 2000,
        max_vehicle_weight: 400,
        compatibility: ['atv', 'motorcycle'],
      }],
      options: [{
        guid_1c: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
        name: 'Тент плоский',
        article: 'TENT-001',
        category: 'cover',
        retail_price: 15000,
        compatible_trailers: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
      }],
      warehouses: [{
        guid_1c: 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
        code: 'SG-1',
        name: 'Склад Сургут основной',
        city: 'Сургут',
        address: 'пр-т Мира, 55',
        warehouse_type: 'retail',
      }],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_1c_import.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title title="Импорт из 1С" />

      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Импорт данных из 1С</h1>
        <p className="text-gray-600">
          Загрузите JSON-файл с данными из 1С для синхронизации прицепов, опций и складов.
        </p>
      </div>

      {/* Карточки статистики текущих данных */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Package className="w-6 h-6 text-blue-600" />}
          label="Прицепов в файле"
          value={data?.trailers?.length || 0}
        />
        <StatCard
          icon={<Wrench className="w-6 h-6 text-green-600" />}
          label="Опций в файле"
          value={data?.options?.length || 0}
        />
        <StatCard
          icon={<Warehouse className="w-6 h-6 text-purple-600" />}
          label="Складов в файле"
          value={data?.warehouses?.length || 0}
        />
      </div>

      {/* Загрузка файла */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">1. Загрузка файла</h2>
        
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Перетащите JSON-файл сюда или <span className="text-blue-600">выберите файл</span>
              </p>
              <p className="text-sm text-gray-400">
                Поддерживается формат JSON экспорта из 1С
              </p>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Удалить файл"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Скачать шаблон
          </button>
        </div>
      </div>

      {/* Настройки импорта */}
      {data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Настройки импорта</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Режим импорта
              </label>
              <div className="flex flex-wrap gap-3">
                <label className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                  ${mode === 'update' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}>
                  <input
                    type="radio"
                    name="mode"
                    value="update"
                    checked={mode === 'update'}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Обновить</span>
                    <p className="text-xs text-gray-500">Обновить существующие, создать новые</p>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                  ${mode === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}>
                  <input
                    type="radio"
                    name="mode"
                    value="full"
                    checked={mode === 'full'}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Полный</span>
                    <p className="text-xs text-gray-500">Заменить все данные из файла</p>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                  ${mode === 'stock_only' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}>
                  <input
                    type="radio"
                    name="mode"
                    value="stock_only"
                    checked={mode === 'stock_only'}
                    onChange={(e) => setMode(e.target.value as ImportMode)}
                    className="text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Только остатки</span>
                    <p className="text-xs text-gray-500">Обновить только складские остатки</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Скрыть превью' : 'Превью данных'}
            </button>
            
            <button
              onClick={handleImport}
              disabled={isImporting || isLoading}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Импортируем...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Запустить импорт
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Превью данных */}
      {showPreview && data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Превью данных</h2>
          
          {/* Прицепы */}
          {data.trailers && data.trailers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Прицепы ({data.trailers.length})
              </h3>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Модель</th>
                      <th className="px-3 py-2 text-left">Название</th>
                      <th className="px-3 py-2 text-left">Категория</th>
                      <th className="px-3 py-2 text-right">Цена</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.trailers.slice(0, 20).map((t, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono text-xs">{t.model}</td>
                        <td className="px-3 py-2">{t.name}</td>
                        <td className="px-3 py-2">{t.category}</td>
                        <td className="px-3 py-2 text-right">
                          {t.retail_price?.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.trailers.length > 20 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    ...и ещё {data.trailers.length - 20}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Опции */}
          {data.options && data.options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Опции ({data.options.length})
              </h3>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Название</th>
                      <th className="px-3 py-2 text-left">Категория</th>
                      <th className="px-3 py-2 text-right">Цена</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.options.slice(0, 10).map((o, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{o.name}</td>
                        <td className="px-3 py-2">{o.category}</td>
                        <td className="px-3 py-2 text-right">
                          {o.retail_price?.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Лог импорта */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Лог операций</h2>
          <div className="max-h-64 overflow-y-auto space-y-2 font-mono text-sm">
            {logs.map(log => (
              <div
                key={log.id}
                className={`flex items-start gap-2 p-2 rounded ${
                  log.type === 'error' ? 'bg-red-50 text-red-800' :
                  log.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  log.type === 'success' ? 'bg-green-50 text-green-800' :
                  'bg-gray-50 text-gray-700'
                }`}
              >
                {log.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {log.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {log.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {log.type === 'info' && <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className={`rounded-lg border p-6 ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {result.success ? 'Импорт успешно завершён' : 'Импорт завершён с ошибками'}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date(result.timestamp).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.imported.trailers}</div>
              <div className="text-xs text-gray-500">Прицепов</div>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{result.imported.options}</div>
              <div className="text-xs text-gray-500">Опций</div>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{result.imported.warehouses}</div>
              <div className="text-xs text-gray-500">Складов</div>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{result.errors.length}</div>
              <div className="text-xs text-gray-500">Ошибок</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Ошибки:</h3>
              <div className="max-h-32 overflow-y-auto text-sm text-red-700 bg-white rounded p-2">
                {result.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Компонент статистической карточки
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

export default Import1CAdmin;
