import { VehicleDatabase, VehicleModel } from './vehicleTypes';

export interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    added: number;
    updated: number;
    deleted: number;
    total: number;
  };
}

export function mergeVehicleDatabases(
  localDb: VehicleDatabase, 
  cloudVehicles: VehicleModel[], 
  cloudVersion: number
): VehicleDatabase {
  // "Cloud wins" strategy:
  // If cloud version is strictly greater than local version, we replace local data with cloud data.
  // If versions are equal, we assume they are in sync (or we could check for diffs, but versioning is simpler).
  // If local version is greater (shouldn't happen in "Cloud wins" unless dev updated local), we might keep local or warn.
  
  if (cloudVersion > localDb.version) {
    return {
      version: cloudVersion,
      updatedAt: new Date().toISOString(),
      vehicles: cloudVehicles
    };
  }
  
  return localDb;
}
