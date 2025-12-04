/**
 * Модуль vehicles - справочник и поиск техники
 */

// Типы
export type { VehicleModel, VehicleDatabase, VehicleType } from './vehicleTypes';

// Поиск
export { searchVehicles } from './vehicleSearch';

// Валидация
export { validateVehicleDatabase, validateVehicle } from './vehicleValidation';

// Синхронизация
export { mergeVehicleDatabases, type SyncResult } from './vehicleSync';
