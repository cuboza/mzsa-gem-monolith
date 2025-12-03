export type VehicleType = 
  | 'boat_pvc'
  | 'boat_aluminum'
  | 'boat_soviet'
  | 'boat_rigid'
  | 'boat' // legacy
  | 'snowmobile'
  | 'atv'
  | 'utv'
  | 'motorcycle'
  | 'jetski'
  | 'car'
  | 'cargo'
  | 'other';

export interface VehicleModel {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  length: number; // mm
  width: number; // mm
  height: number; // mm
  weight: number; // kg
  aliases?: string[];
  searchKeywords?: string[];
  popularityScore?: number;
  
  // Optional fields for specific types
  foldedLength?: number; // for PVC boats
  foldedWidth?: number;
  foldedHeight?: number;
  
  imageUrl?: string;
  description?: string;
}

export interface VehicleDatabase {
  version: number;
  updatedAt: string;
  vehicles: VehicleModel[];
}
