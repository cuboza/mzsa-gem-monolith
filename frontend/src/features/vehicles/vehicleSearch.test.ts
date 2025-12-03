
import { describe, it, expect } from 'vitest';
import { searchVehicles } from './vehicleSearch';
import vehiclesDb from '../../data/vehiclesDatabase.json';
import { VehicleModel } from './vehicleTypes';

// Cast the imported JSON to the correct type
const vehicles = vehiclesDb.vehicles as VehicleModel[];

describe('Smart Vehicle Search', () => {
  it('should find vehicles by brand name (BRP)', () => {
    const results = searchVehicles(vehicles, 'BRP');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].vehicle.brand).toBe('BRP');
    // Should match exact or partial
    expect(results[0].score).toBeGreaterThan(50);
  });

  it('should find vehicles by Russian alias (Сифорс -> CFMOTO)', () => {
    const results = searchVehicles(vehicles, 'Сифорс');
    expect(results.length).toBeGreaterThan(0);
    const cforce = results.find(r => r.vehicle.model.includes('CFORCE'));
    expect(cforce).toBeDefined();
    expect(cforce?.matchType).toBe('alias');
  });

  it('should find vehicles by Russian alias (Гепард -> Stels)', () => {
    const results = searchVehicles(vehicles, 'Гепард');
    expect(results.length).toBeGreaterThan(0);
    const guepard = results.find(r => r.vehicle.model.includes('Guepard'));
    expect(guepard).toBeDefined();
    expect(guepard?.vehicle.brand).toBe('Stels');
  });

  it('should find vehicles by Russian alias (Поларис -> Polaris)', () => {
    const results = searchVehicles(vehicles, 'Поларис');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].vehicle.brand).toBe('Polaris');
  });

  it('should find vehicles by keyword (снегоход)', () => {
    const results = searchVehicles(vehicles, 'снегоход');
    expect(results.length).toBeGreaterThan(0);
    // Check that we found snowmobiles
    const snowmobile = results.find(r => r.vehicle.type === 'snowmobile');
    expect(snowmobile).toBeDefined();
  });

  it('should find vehicles by model name (Frontier)', () => {
    const results = searchVehicles(vehicles, 'Frontier');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].vehicle.model).toContain('Frontier');
  });

  it('should handle case insensitivity', () => {
    const results1 = searchVehicles(vehicles, 'brp');
    const results2 = searchVehicles(vehicles, 'BRP');
    expect(results1.length).toBe(results2.length);
    expect(results1[0].vehicle.id).toBe(results2[0].vehicle.id);
  });

  it('should return empty array for nonsense query', () => {
    const results = searchVehicles(vehicles, 'xyz123notfound');
    expect(results).toHaveLength(0);
  });
});
