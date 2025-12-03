import { VehicleModel } from './vehicleTypes';

export interface SearchResult {
  vehicle: VehicleModel;
  score: number;
  matchType: 'exact' | 'alias' | 'partial' | 'keyword';
}

export function searchVehicles(
  vehicles: VehicleModel[], 
  query: string, 
  options: { limit?: number; type?: string } = {}
): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results: SearchResult[] = [];

  for (const vehicle of vehicles) {
    if (options.type && vehicle.type !== options.type) continue;

    let score = 0;
    let matchType: SearchResult['matchType'] | null = null;

    const fullName = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
    const modelName = vehicle.model.toLowerCase();
    
    // Exact match
    if (fullName === normalizedQuery || modelName === normalizedQuery) {
      score = 100;
      matchType = 'exact';
    } 
    // Starts with
    else if (fullName.startsWith(normalizedQuery)) {
      score = 80;
      matchType = 'partial';
    }
    // Contains
    else if (fullName.includes(normalizedQuery)) {
      score = 60;
      matchType = 'partial';
    }
    
    // Alias check
    if (vehicle.aliases) {
      for (const alias of vehicle.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (lowerAlias === normalizedQuery) {
          score = Math.max(score, 95);
          matchType = 'alias';
        } else if (lowerAlias.includes(normalizedQuery)) {
          score = Math.max(score, 70);
          matchType = matchType || 'alias';
        }
      }
    }

    // Keyword check
    if (vehicle.searchKeywords) {
      for (const keyword of vehicle.searchKeywords) {
        if (keyword.toLowerCase().includes(normalizedQuery)) {
          score = Math.max(score, 50);
          matchType = matchType || 'keyword';
        }
      }
    }

    if (score > 0 && matchType) {
      // Boost by popularity
      if (vehicle.popularityScore) {
        score += vehicle.popularityScore / 10;
      }
      
      results.push({ vehicle, score, matchType });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 20);
}
