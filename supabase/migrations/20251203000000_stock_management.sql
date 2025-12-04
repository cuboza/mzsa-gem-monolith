-- Миграция для складского учёта
-- Адаптирована под существующую схему Supabase
-- Таблицы warehouses, trailer_stock, option_stock уже существуют

-- ============================================================================
-- ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ДЛЯ ТАБЛИЦЫ WAREHOUSES (если нет)
-- ============================================================================

-- Добавляем недостающие поля
DO $$
BEGIN
  -- Добавляем phone если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'phone') THEN
    ALTER TABLE warehouses ADD COLUMN phone VARCHAR(50);
  END IF;
  
  -- Добавляем email если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'email') THEN
    ALTER TABLE warehouses ADD COLUMN email VARCHAR(255);
  END IF;
  
  -- Добавляем region если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'region') THEN
    ALTER TABLE warehouses ADD COLUMN region VARCHAR(50) DEFAULT 'ХМАО';
  END IF;
  
  -- Добавляем price_list если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'price_list') THEN
    ALTER TABLE warehouses ADD COLUMN price_list VARCHAR(50) DEFAULT 'retail';
  END IF;
  
  -- Добавляем priority если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'priority') THEN
    ALTER TABLE warehouses ADD COLUMN priority INTEGER DEFAULT 1;
  END IF;
  
  -- Добавляем description если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'description') THEN
    ALTER TABLE warehouses ADD COLUMN description TEXT;
  END IF;
  
  -- Добавляем can_ship если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'can_ship') THEN
    ALTER TABLE warehouses ADD COLUMN can_ship BOOLEAN DEFAULT true;
  END IF;
  
  -- Добавляем working_hours если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'working_hours') THEN
    ALTER TABLE warehouses ADD COLUMN working_hours VARCHAR(100);
  END IF;
  
  -- Добавляем sort_order если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warehouses' AND column_name = 'sort_order') THEN
    ALTER TABLE warehouses ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ДЛЯ ТАБЛИЦЫ TRAILER_STOCK (если нет)
-- ============================================================================

DO $$
BEGIN
  -- Добавляем in_transit если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trailer_stock' AND column_name = 'in_transit') THEN
    ALTER TABLE trailer_stock ADD COLUMN in_transit INTEGER DEFAULT 0;
  END IF;
  
  -- Добавляем min_stock если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trailer_stock' AND column_name = 'min_stock') THEN
    ALTER TABLE trailer_stock ADD COLUMN min_stock INTEGER DEFAULT 0;
  END IF;
  
  -- Добавляем last_counted_at если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trailer_stock' AND column_name = 'last_counted_at') THEN
    ALTER TABLE trailer_stock ADD COLUMN last_counted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ДЛЯ ТАБЛИЦЫ OPTION_STOCK (если нет)
-- ============================================================================

DO $$
BEGIN
  -- Добавляем in_transit если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'option_stock' AND column_name = 'in_transit') THEN
    ALTER TABLE option_stock ADD COLUMN in_transit INTEGER DEFAULT 0;
  END IF;
  
  -- Добавляем min_stock если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'option_stock' AND column_name = 'min_stock') THEN
    ALTER TABLE option_stock ADD COLUMN min_stock INTEGER DEFAULT 0;
  END IF;
  
  -- Добавляем last_counted_at если не существует
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'option_stock' AND column_name = 'last_counted_at') THEN
    ALTER TABLE option_stock ADD COLUMN last_counted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- ТАБЛИЦА ДВИЖЕНИЙ (stock_movements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Тип операции
  movement_type VARCHAR(50) NOT NULL, -- receipt, shipment, transfer, adjustment
  
  -- Товар (один из двух)
  trailer_id UUID REFERENCES trailers(id) ON DELETE SET NULL,
  option_id UUID REFERENCES options(id) ON DELETE SET NULL,
  
  -- Склады
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Количества
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER, -- Остаток до операции
  new_quantity INTEGER, -- Остаток после операции
  
  -- Документ
  document_number VARCHAR(100),
  reason TEXT,
  
  -- Связанные сущности
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Если это расход по заказу
  
  -- Автор
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Валидация
  CONSTRAINT check_movement_type CHECK (movement_type IN ('receipt', 'shipment', 'transfer', 'adjustment'))
);

-- Индексы для журнала движений
CREATE INDEX IF NOT EXISTS idx_stock_movements_trailer ON stock_movements(trailer_id) WHERE trailer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_option ON stock_movements(option_id) WHERE option_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_warehouse ON stock_movements(from_warehouse_id) WHERE from_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_warehouse ON stock_movements(to_warehouse_id) WHERE to_warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_document ON stock_movements(document_number) WHERE document_number IS NOT NULL;

-- ============================================================================
-- RLS ПОЛИТИКИ ДЛЯ ДВИЖЕНИЙ
-- ============================================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Авторизованные могут читать
DROP POLICY IF EXISTS stock_movements_read ON stock_movements;
CREATE POLICY stock_movements_read ON stock_movements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Авторизованные могут создавать
DROP POLICY IF EXISTS stock_movements_insert ON stock_movements;
CREATE POLICY stock_movements_insert ON stock_movements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Только админы могут удалять
DROP POLICY IF EXISTS stock_movements_delete ON stock_movements;
CREATE POLICY stock_movements_delete ON stock_movements
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- ФУНКЦИЯ: Обновление остатка прицепа (атомарная операция)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_trailer_stock_quantity(
  p_trailer_id UUID,
  p_warehouse_id UUID,
  p_delta INTEGER
)
RETURNS void AS $$
BEGIN
  -- Обновляем существующую запись
  UPDATE trailer_stock 
  SET 
    available_quantity = GREATEST(0, available_quantity + p_delta),
    updated_at = NOW()
  WHERE trailer_id = p_trailer_id AND warehouse_id = p_warehouse_id;
  
  -- Если запись не найдена и delta положительная, создаём новую
  IF NOT FOUND AND p_delta > 0 THEN
    INSERT INTO trailer_stock (trailer_id, warehouse_id, available_quantity, reserved_quantity)
    VALUES (p_trailer_id, p_warehouse_id, p_delta, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ФУНКЦИЯ: Обновление остатка опции (атомарная операция)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_option_stock_quantity(
  p_option_id UUID,
  p_warehouse_id UUID,
  p_delta INTEGER
)
RETURNS void AS $$
BEGIN
  -- Обновляем существующую запись
  UPDATE option_stock 
  SET 
    available_quantity = GREATEST(0, available_quantity + p_delta),
    updated_at = NOW()
  WHERE option_id = p_option_id AND warehouse_id = p_warehouse_id;
  
  -- Если запись не найдена и delta положительная, создаём новую
  IF NOT FOUND AND p_delta > 0 THEN
    INSERT INTO option_stock (option_id, warehouse_id, available_quantity, reserved_quantity)
    VALUES (p_option_id, p_warehouse_id, p_delta, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ПРЕДСТАВЛЕНИЕ: Сводка остатков прицепов по складам
-- ============================================================================
CREATE OR REPLACE VIEW trailer_stock_summary AS
SELECT 
  t.id AS trailer_id,
  t.slug,
  t.name AS trailer_name,
  t.article,
  t.main_image_url,
  t.retail_price,
  c.slug AS category,
  COALESCE(SUM(ts.available_quantity), 0) AS total_quantity,
  COALESCE(SUM(ts.reserved_quantity), 0) AS total_reserved,
  COALESCE(SUM(ts.available_quantity) - SUM(ts.reserved_quantity), 0) AS total_available,
  COALESCE(SUM(ts.in_transit), 0) AS total_in_transit,
  COUNT(DISTINCT ts.warehouse_id) AS warehouse_count,
  jsonb_object_agg(
    w.id::text,
    jsonb_build_object(
      'warehouse_name', w.name,
      'warehouse_address', w.address,
      'quantity', COALESCE(ts.available_quantity, 0),
      'reserved', COALESCE(ts.reserved_quantity, 0),
      'available', COALESCE(ts.available_quantity - ts.reserved_quantity, 0),
      'in_transit', COALESCE(ts.in_transit, 0)
    )
  ) FILTER (WHERE w.id IS NOT NULL) AS by_warehouse
FROM trailers t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN trailer_stock ts ON t.id = ts.trailer_id
LEFT JOIN warehouses w ON ts.warehouse_id = w.id AND w.status = 'active'
WHERE t.status = 'active'
GROUP BY t.id, t.slug, t.name, t.article, t.main_image_url, t.retail_price, c.slug;

-- Даём доступ к представлению
GRANT SELECT ON trailer_stock_summary TO authenticated;
GRANT ALL ON stock_movements TO authenticated;
