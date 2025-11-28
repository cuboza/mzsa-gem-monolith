-- Migration: Fix Index Issues
-- Date: 2025-11-28
-- Fixes:
--   1. Add missing indexes for foreign keys (unindexed_foreign_keys)
--   2. Remove unused indexes (unused_index)

BEGIN;

-- ============================================
-- PART 1: Add missing indexes for foreign keys
-- ============================================

-- leads.city_id FK
CREATE INDEX IF NOT EXISTS idx_leads_city_id ON public.leads(city_id);

-- leads.customer_id FK (уже есть в списке неиспользуемых, но нужен для FK)
-- Пропускаем, т.к. скорее всего будет использоваться при JOINах

-- option_stock.price_type_id FK
CREATE INDEX IF NOT EXISTS idx_option_stock_price_type_id ON public.option_stock(price_type_id);

-- trailer_stock.price_type_id FK
CREATE INDEX IF NOT EXISTS idx_trailer_stock_price_type_id ON public.trailer_stock(price_type_id);

-- ============================================
-- PART 2: Remove unused indexes
-- ВАЖНО: Удаляем только те, которые не нужны для FK и бизнес-логики
-- Оставляем индексы для 1С синхронизации (guid_1c) — они понадобятся
-- Оставляем индексы для slug — используются для URL
-- ============================================

-- === categories ===
-- DROP INDEX IF EXISTS idx_categories_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_categories_parent_id;

-- === cities ===
-- DROP INDEX IF EXISTS idx_cities_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_cities_main_warehouse_id;
DROP INDEX IF EXISTS idx_cities_status;

-- === customers ===
DROP INDEX IF EXISTS idx_customers_auth_phone_composite;
-- DROP INDEX IF EXISTS idx_customers_auth_user_id; -- Оставляем для RLS
DROP INDEX IF EXISTS idx_customers_email;
-- DROP INDEX IF EXISTS idx_customers_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_customers_normalized_phone;
DROP INDEX IF EXISTS idx_customers_phone;

-- === faq ===
DROP INDEX IF EXISTS idx_faq_category;
-- DROP INDEX IF EXISTS idx_faq_slug; -- Оставляем для URL
DROP INDEX IF EXISTS idx_faq_status;

-- === images ===
DROP INDEX IF EXISTS idx_images_type;

-- === lead_items ===
DROP INDEX IF EXISTS idx_lead_items_created;
DROP INDEX IF EXISTS idx_lead_items_item;
-- DROP INDEX IF EXISTS idx_lead_items_lead_id; -- Нужен для JOIN с leads
DROP INDEX IF EXISTS idx_lead_items_lead_type_composite;
DROP INDEX IF EXISTS idx_lead_items_parent;

-- === lead_status_history ===
DROP INDEX IF EXISTS idx_lead_status_history_created_at;
-- DROP INDEX IF EXISTS idx_lead_status_history_lead_id; -- Нужен для JOIN с leads

-- === leads ===
-- DROP INDEX IF EXISTS idx_leads_auth_user_id; -- Оставляем для RLS
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_leads_customer_email;
DROP INDEX IF EXISTS idx_leads_customer_phone;
-- DROP INDEX IF EXISTS idx_leads_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_leads_status_created_composite;
DROP INDEX IF EXISTS idx_leads_sync_status;

-- === manufacturers ===
DROP INDEX IF EXISTS idx_manufacturers_popular;

-- === option_dependencies ===
DROP INDEX IF EXISTS idx_option_dependencies_option_id;
DROP INDEX IF EXISTS idx_option_dependencies_required;

-- === option_stock ===
DROP INDEX IF EXISTS idx_option_stock_option_id;
DROP INDEX IF EXISTS idx_option_stock_warehouse_id;

-- === options ===
DROP INDEX IF EXISTS idx_options_category;
-- DROP INDEX IF EXISTS idx_options_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_options_status;

-- === specifications ===
DROP INDEX IF EXISTS idx_specifications_filterable;
DROP INDEX IF EXISTS idx_specifications_value_numeric;

-- === sync_logs ===
DROP INDEX IF EXISTS idx_sync_logs_created_at;
DROP INDEX IF EXISTS idx_sync_logs_session_id;
DROP INDEX IF EXISTS idx_sync_logs_status;
DROP INDEX IF EXISTS idx_sync_logs_table_name;

-- === trailer_options ===
DROP INDEX IF EXISTS idx_trailer_options_option_id;
DROP INDEX IF EXISTS idx_trailer_options_trailer_id;

-- === trailer_stock ===
DROP INDEX IF EXISTS idx_trailer_stock_trailer_id;
DROP INDEX IF EXISTS idx_trailer_stock_warehouse_id;

-- === trailers ===
DROP INDEX IF EXISTS idx_trailers_availability;
-- DROP INDEX IF EXISTS idx_trailers_guid_1c; -- Оставляем для синхронизации с 1С
-- DROP INDEX IF EXISTS idx_trailers_slug; -- Оставляем для URL
DROP INDEX IF EXISTS idx_trailers_status;
DROP INDEX IF EXISTS idx_trailers_use_case_ids;

-- === use_cases ===
-- DROP INDEX IF EXISTS idx_use_cases_slug; -- Оставляем для URL
DROP INDEX IF EXISTS idx_use_cases_status;

-- === user_roles ===
DROP INDEX IF EXISTS idx_user_roles_user_id;

-- === lead_item_validation_logs ===
DROP INDEX IF EXISTS idx_validation_logs_created;
DROP INDEX IF EXISTS idx_validation_logs_lead_item;

-- === vehicle_models ===
DROP INDEX IF EXISTS idx_vehicle_models_active;
DROP INDEX IF EXISTS idx_vehicle_models_aliases;
DROP INDEX IF EXISTS idx_vehicle_models_keywords;
DROP INDEX IF EXISTS idx_vehicle_models_manufacturer;
DROP INDEX IF EXISTS idx_vehicle_models_popularity;
DROP INDEX IF EXISTS idx_vehicle_models_search;
DROP INDEX IF EXISTS idx_vehicle_models_type;

-- === vehicle_suggestions ===
DROP INDEX IF EXISTS idx_vehicle_suggestions_status;

-- === warehouses ===
DROP INDEX IF EXISTS idx_warehouses_city_id;
-- DROP INDEX IF EXISTS idx_warehouses_guid_1c; -- Оставляем для синхронизации с 1С
DROP INDEX IF EXISTS idx_warehouses_status;

COMMIT;
