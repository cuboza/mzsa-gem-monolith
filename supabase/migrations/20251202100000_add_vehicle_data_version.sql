-- Add data_version column for sync logic
ALTER TABLE vehicle_models 
ADD COLUMN IF NOT EXISTS data_version INTEGER DEFAULT 1;

-- Update vehicle_type check constraint to include new types
ALTER TABLE vehicle_models 
DROP CONSTRAINT IF EXISTS vehicle_models_vehicle_type_check;

ALTER TABLE vehicle_models 
ADD CONSTRAINT vehicle_models_vehicle_type_check 
CHECK (vehicle_type IN (
  'boat', 
  'boat_pvc', 
  'boat_rigid', 
  'boat_aluminum', 
  'boat_soviet', 
  'snowmobile', 
  'atv', 
  'utv', 
  'motorcycle', 
  'jetski', 
  'car', 
  'cargo', 
  'other'
));

-- Create index for faster search if not exists
CREATE INDEX IF NOT EXISTS idx_vehicle_models_search_keywords ON vehicle_models USING GIN (search_keywords);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_aliases ON vehicle_models USING GIN (aliases);
