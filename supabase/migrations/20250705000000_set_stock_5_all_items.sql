-- Миграция для установки остатков = 5 для всех прицепов и опций
-- Выполнить в Supabase Dashboard → SQL Editor

-- 1. Создаём основной склад если его нет
INSERT INTO warehouses (name, code, warehouse_type, status, is_main, address)
SELECT 'Основной склад Сургут', 'SURGUT-MAIN', 'retail', 'active', true, 'пр-т Мира, 55, Сургут'
WHERE NOT EXISTS (
  SELECT 1 FROM warehouses WHERE status = 'active' AND is_main = true
);

-- 2. Получаем ID основного склада
DO $$
DECLARE
  main_warehouse_id uuid;
BEGIN
  -- Получаем ID активного основного склада
  SELECT id INTO main_warehouse_id 
  FROM warehouses 
  WHERE status = 'active' 
  ORDER BY is_main DESC, created_at ASC 
  LIMIT 1;
  
  IF main_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Не найден активный склад!';
  END IF;
  
  RAISE NOTICE 'Используем склад: %', main_warehouse_id;
  
  -- 3. Удаляем старые остатки (опционально)
  DELETE FROM trailer_stock WHERE warehouse_id = main_warehouse_id;
  DELETE FROM option_stock WHERE warehouse_id = main_warehouse_id;
  
  -- 4. Создаём остатки для всех активных прицепов
  INSERT INTO trailer_stock (trailer_id, warehouse_id, quantity, available_quantity, reserved_quantity)
  SELECT 
    id AS trailer_id,
    main_warehouse_id,
    5 AS quantity,
    5 AS available_quantity,
    0 AS reserved_quantity
  FROM trailers 
  WHERE status = 'active';
  
  RAISE NOTICE 'Создано остатков прицепов: %', (SELECT COUNT(*) FROM trailer_stock WHERE warehouse_id = main_warehouse_id);
  
  -- 5. Создаём остатки для всех активных опций
  INSERT INTO option_stock (option_id, warehouse_id, quantity, available_quantity, reserved_quantity)
  SELECT 
    id AS option_id,
    main_warehouse_id,
    5 AS quantity,
    5 AS available_quantity,
    0 AS reserved_quantity
  FROM options 
  WHERE status = 'active';
  
  RAISE NOTICE 'Создано остатков опций: %', (SELECT COUNT(*) FROM option_stock WHERE warehouse_id = main_warehouse_id);
  
END $$;

-- 6. Проверка результатов
SELECT 'trailer_stock' as table_name, COUNT(*) as count FROM trailer_stock
UNION ALL
SELECT 'option_stock' as table_name, COUNT(*) as count FROM option_stock;

-- Вывести сводку по остаткам прицепов
SELECT 
  t.name,
  t.model,
  ts.quantity,
  ts.available_quantity,
  ts.reserved_quantity,
  w.name as warehouse_name
FROM trailer_stock ts
JOIN trailers t ON t.id = ts.trailer_id
JOIN warehouses w ON w.id = ts.warehouse_id
ORDER BY t.name
LIMIT 20;
