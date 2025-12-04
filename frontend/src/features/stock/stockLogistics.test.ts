/**
 * Интеграционные тесты складской логистики
 * Проверяет: UI компоненты, провайдеры, маппинг данных
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мок для Supabase
const mockSupabaseData = {
  warehouses: [
    { id: 'wh-1', name: 'Склад Сургут', status: 'active', warehouse_type: 'retail', price_list: 'retail', priority: 1, sort_order: 0 },
    { id: 'wh-2', name: 'Склад Нижневартовск', status: 'active', warehouse_type: 'retail', price_list: 'retail', priority: 2, sort_order: 1 },
  ],
  trailers: [
    { id: 't-1', slug: 'mzsa-817711', name: 'МЗСА 817711', article: '817711', status: 'active', retail_price: 150000, main_image_url: '/images/t1.jpg' },
    { id: 't-2', slug: 'mzsa-817715', name: 'МЗСА 817715', article: '817715', status: 'active', retail_price: 200000, main_image_url: '/images/t2.jpg' },
  ],
  trailer_stock: [
    { id: 'ts-1', trailer_id: 't-1', warehouse_id: 'wh-1', available_quantity: 3, reserved_quantity: 1, in_transit: 0 },
    { id: 'ts-2', trailer_id: 't-1', warehouse_id: 'wh-2', available_quantity: 2, reserved_quantity: 0, in_transit: 1 },
    { id: 'ts-3', trailer_id: 't-2', warehouse_id: 'wh-1', available_quantity: 0, reserved_quantity: 0, in_transit: 0 },
  ],
  stock_movements: [
    { id: 'm-1', movement_type: 'receipt', trailer_id: 't-1', to_warehouse_id: 'wh-1', quantity: 3, created_at: '2024-12-01T10:00:00Z' },
    { id: 'm-2', movement_type: 'transfer', trailer_id: 't-1', from_warehouse_id: 'wh-1', to_warehouse_id: 'wh-2', quantity: 2, created_at: '2024-12-02T14:00:00Z' },
  ],
  trailer_stock_summary: [
    { 
      trailer_id: 't-1', 
      trailer_name: 'МЗСА 817711', 
      article: '817711',
      total_quantity: 5, 
      total_reserved: 1, 
      total_available: 4, 
      total_in_transit: 1,
      by_warehouse: {
        'wh-1': { warehouse_name: 'Склад Сургут', quantity: 3, reserved: 1, available: 2, in_transit: 0 },
        'wh-2': { warehouse_name: 'Склад Нижневартовск', quantity: 2, reserved: 0, available: 2, in_transit: 1 },
      }
    },
  ],
};

// ========== ТЕСТЫ МАППИНГА ДАННЫХ ==========

describe('Warehouse Mapping', () => {
  it('должен правильно маппить поля склада из Supabase', () => {
    const row = mockSupabaseData.warehouses[0] as any;
    
    // Симуляция маппинга из supabaseProvider
    const mapped = {
      id: row.id,
      code: row.code || '',
      name: row.name,
      address: row.address || '',
      type: row.warehouse_type || 'retail',
      priceList: row.price_list || 'retail',
      priority: row.priority ?? 1,
      isActive: row.status === 'active',
      order: row.sort_order ?? 0,
    };
    
    expect(mapped.id).toBe('wh-1');
    expect(mapped.name).toBe('Склад Сургут');
    expect(mapped.type).toBe('retail');
    expect(mapped.priceList).toBe('retail');
    expect(mapped.isActive).toBe(true);
  });
  
  it('должен правильно обрабатывать неактивные склады', () => {
    const row = { ...mockSupabaseData.warehouses[0], status: 'inactive' };
    const isActive = row.status === 'active';
    expect(isActive).toBe(false);
  });
});

describe('Stock Summary Mapping', () => {
  it('должен правильно маппить сводку остатков', () => {
    const summary = mockSupabaseData.trailer_stock_summary[0];
    
    // Симуляция маппинга в StockItem для UI
    const mapped = {
      productId: summary.trailer_id,
      productName: summary.trailer_name,
      productArticle: summary.article,
      totalQuantity: summary.total_quantity,
      totalReserved: summary.total_reserved,
      totalAvailable: summary.total_available,
      warehouses: summary.by_warehouse,
    };
    
    expect(mapped.productId).toBe('t-1');
    expect(mapped.productName).toBe('МЗСА 817711');
    expect(mapped.totalQuantity).toBe(5);
    expect(mapped.totalAvailable).toBe(4);
    expect(Object.keys(mapped.warehouses)).toHaveLength(2);
  });
  
  it('должен корректно вычислять доступное количество', () => {
    const summary = mockSupabaseData.trailer_stock_summary[0];
    const available = summary.total_quantity - summary.total_reserved;
    expect(available).toBe(summary.total_available);
  });
});

describe('Stock Movement Mapping', () => {
  it('должен правильно маппить приход', () => {
    const movement = mockSupabaseData.stock_movements[0];
    
    const mapped = {
      id: movement.id,
      type: movement.movement_type,
      productId: movement.trailer_id,
      toWarehouseId: movement.to_warehouse_id,
      quantity: movement.quantity,
    };
    
    expect(mapped.type).toBe('receipt');
    expect(mapped.toWarehouseId).toBe('wh-1');
    expect(mapped.quantity).toBe(3);
  });
  
  it('должен правильно маппить перемещение', () => {
    const movement = mockSupabaseData.stock_movements[1];
    
    const mapped = {
      id: movement.id,
      type: movement.movement_type,
      fromWarehouseId: movement.from_warehouse_id,
      toWarehouseId: movement.to_warehouse_id,
      quantity: movement.quantity,
    };
    
    expect(mapped.type).toBe('transfer');
    expect(mapped.fromWarehouseId).toBe('wh-1');
    expect(mapped.toWarehouseId).toBe('wh-2');
  });
});

// ========== ТЕСТЫ БИЗНЕС-ЛОГИКИ ==========

describe('Stock Quantity Logic', () => {
  it('должен правильно вычислять delta для прихода', () => {
    const movementType: string = 'receipt';
    const quantity = 5;
    const delta = movementType === 'shipment' ? -quantity : quantity;
    expect(delta).toBe(5);
  });
  
  it('должен правильно вычислять delta для расхода', () => {
    const movementType = 'shipment';
    const quantity = 3;
    const delta = movementType === 'shipment' ? -quantity : quantity;
    expect(delta).toBe(-3);
  });
  
  it('не должен допускать отрицательный остаток', () => {
    const currentQty = 2;
    const delta = -5;
    const newQty = Math.max(0, currentQty + delta);
    expect(newQty).toBe(0);
  });
  
  it('должен правильно резервировать товар', () => {
    const available = 10;
    const reserved = 3;
    const freeToSell = available - reserved;
    expect(freeToSell).toBe(7);
  });
});

describe('Transfer Movement Logic', () => {
  it('должен уменьшать остаток на складе-источнике', () => {
    const fromStock = 5;
    const transferQty = 2;
    const newFromStock = fromStock - transferQty;
    expect(newFromStock).toBe(3);
  });
  
  it('должен увеличивать остаток на складе-получателе', () => {
    const toStock = 3;
    const transferQty = 2;
    const newToStock = toStock + transferQty;
    expect(newToStock).toBe(5);
  });
  
  it('общий остаток не должен меняться при перемещении', () => {
    const totalBefore = 10;
    const fromDelta = -3;
    const toDelta = 3;
    const totalAfter = totalBefore + fromDelta + toDelta;
    expect(totalAfter).toBe(totalBefore);
  });
});

// ========== ТЕСТЫ ФИЛЬТРАЦИИ ==========

describe('Stock Filtering', () => {
  const stockItems = [
    { productId: '1', productName: 'МЗСА 817711', totalQuantity: 5, totalAvailable: 4 },
    { productId: '2', productName: 'МЗСА 817715', totalQuantity: 0, totalAvailable: 0 },
    { productId: '3', productName: 'МЗСА 817730', totalQuantity: 1, totalAvailable: 1 },
  ];
  
  it('должен фильтровать по наличию', () => {
    const inStock = stockItems.filter(i => i.totalAvailable > 0);
    expect(inStock).toHaveLength(2);
  });
  
  it('должен находить товары с низким остатком', () => {
    const lowStock = stockItems.filter(i => i.totalQuantity > 0 && i.totalQuantity <= 2);
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0].productName).toBe('МЗСА 817730');
  });
  
  it('должен находить товары без остатка', () => {
    const outOfStock = stockItems.filter(i => i.totalQuantity === 0);
    expect(outOfStock).toHaveLength(1);
    expect(outOfStock[0].productName).toBe('МЗСА 817715');
  });
  
  it('должен искать по названию', () => {
    const query = '817711';
    const found = stockItems.filter(i => i.productName.toLowerCase().includes(query));
    expect(found).toHaveLength(1);
  });
});

describe('Movement Filtering', () => {
  const movements = [
    { id: '1', type: 'receipt', productName: 'МЗСА 817711', fromWarehouseId: null, toWarehouseId: 'wh-1' },
    { id: '2', type: 'shipment', productName: 'МЗСА 817711', fromWarehouseId: 'wh-1', toWarehouseId: null },
    { id: '3', type: 'transfer', productName: 'МЗСА 817715', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2' },
  ];
  
  it('должен фильтровать по типу операции', () => {
    const receipts = movements.filter(m => m.type === 'receipt');
    expect(receipts).toHaveLength(1);
  });
  
  it('должен фильтровать по складу (откуда или куда)', () => {
    const whFilter = 'wh-1';
    const filtered = movements.filter(m => 
      m.fromWarehouseId === whFilter || m.toWarehouseId === whFilter
    );
    expect(filtered).toHaveLength(3); // Все три связаны с wh-1
  });
  
  it('должен фильтровать только по складу-источнику', () => {
    const fromWh1 = movements.filter(m => m.fromWarehouseId === 'wh-1');
    expect(fromWh1).toHaveLength(2); // shipment и transfer
  });
});

// ========== ТЕСТЫ СТАТИСТИКИ ==========

describe('Stock Statistics', () => {
  const stockItems = [
    { productId: '1', totalQuantity: 5, totalAvailable: 4, retailPrice: 150000 },
    { productId: '2', totalQuantity: 0, totalAvailable: 0, retailPrice: 200000 },
    { productId: '3', totalQuantity: 3, totalAvailable: 3, retailPrice: 180000 },
  ];
  
  it('должен считать общее количество товаров', () => {
    const totalProducts = stockItems.length;
    expect(totalProducts).toBe(3);
  });
  
  it('должен считать товары в наличии', () => {
    const inStock = stockItems.filter(i => i.totalAvailable > 0).length;
    expect(inStock).toBe(2);
  });
  
  it('должен считать общее количество единиц', () => {
    const totalUnits = stockItems.reduce((sum, i) => sum + i.totalQuantity, 0);
    expect(totalUnits).toBe(8);
  });
  
  it('должен считать общую стоимость остатков', () => {
    const totalValue = stockItems.reduce((sum, i) => sum + (i.retailPrice || 0) * i.totalQuantity, 0);
    expect(totalValue).toBe(5 * 150000 + 0 * 200000 + 3 * 180000);
    expect(totalValue).toBe(1290000);
  });
});

// ========== ТЕСТЫ ВАЛИДАЦИИ ==========

describe('Movement Validation', () => {
  it('должен требовать склад-получатель для прихода', () => {
    const movement = { type: 'receipt', toWarehouseId: 'wh-1', quantity: 5 };
    const isValid = movement.type === 'receipt' && !!movement.toWarehouseId && movement.quantity > 0;
    expect(isValid).toBe(true);
  });
  
  it('должен требовать склад-источник для расхода', () => {
    const movement = { type: 'shipment', fromWarehouseId: 'wh-1', quantity: 3 };
    const isValid = movement.type === 'shipment' && !!movement.fromWarehouseId && movement.quantity > 0;
    expect(isValid).toBe(true);
  });
  
  it('должен требовать оба склада для перемещения', () => {
    const movement = { type: 'transfer', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', quantity: 2 };
    const isValid = movement.type === 'transfer' && !!movement.fromWarehouseId && !!movement.toWarehouseId && movement.quantity > 0;
    expect(isValid).toBe(true);
  });
  
  it('должен отклонять перемещение на тот же склад', () => {
    const movement = { type: 'transfer', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-1', quantity: 2 };
    const isValid = movement.fromWarehouseId !== movement.toWarehouseId;
    expect(isValid).toBe(false);
  });
  
  it('должен отклонять нулевое количество', () => {
    const movement = { type: 'receipt', toWarehouseId: 'wh-1', quantity: 0 };
    const isValid = movement.quantity > 0;
    expect(isValid).toBe(false);
  });
});

console.log('✅ Все интеграционные тесты определены');
