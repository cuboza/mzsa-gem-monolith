import { VehicleModel, VehicleDatabase, VehicleType } from './vehicleTypes';

const VALID_TYPES: Set<VehicleType> = new Set([
  'boat_pvc', 'boat_aluminum', 'boat_soviet', 'boat_rigid', 'boat',
  'snowmobile', 'atv', 'utv', 'motorcycle', 'jetski', 'car', 'cargo', 'other'
]);

export interface ValidationError {
  id?: string;
  field?: string;
  message: string;
}

export function validateVehicle(vehicle: VehicleModel): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!vehicle.id) errors.push({ message: 'Missing ID' });
  if (!vehicle.brand) errors.push({ id: vehicle.id, field: 'brand', message: 'Missing brand' });
  if (!vehicle.model) errors.push({ id: vehicle.id, field: 'model', message: 'Missing model' });
  
  if (!vehicle.type || !VALID_TYPES.has(vehicle.type)) {
    errors.push({ id: vehicle.id, field: 'type', message: `Invalid type: ${vehicle.type}` });
  }

  if (typeof vehicle.length !== 'number' || vehicle.length <= 0) {
    errors.push({ id: vehicle.id, field: 'length', message: 'Invalid length' });
  }
  
  if (typeof vehicle.width !== 'number' || vehicle.width <= 0) {
    errors.push({ id: vehicle.id, field: 'width', message: 'Invalid width' });
  }
  
  return errors;
}

export function validateVehicleDatabase(data: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data || typeof data !== 'object') {
    return [{ message: 'Invalid JSON format' }];
  }
  
  if (typeof data.version !== 'number') {
    errors.push({ message: 'Missing or invalid version number' });
  }
  
  if (!Array.isArray(data.vehicles)) {
    errors.push({ message: 'Missing vehicles array' });
    return errors;
  }
  
  data.vehicles.forEach((v: any, index: number) => {
    const vehicleErrors = validateVehicle(v);
    vehicleErrors.forEach(err => {
      errors.push({ ...err, message: `Item ${index} (${v.id || 'unknown'}): ${err.message}` });
    });
  });
  
  return errors;
}
