/**
 * Утилита для парсинга умного поиска
 * Поддерживает: категории, размеры, объём, вес
 */

export interface ParsedSearch {
  category?: 'boat' | 'snowmobile' | 'atv' | 'motorcycle' | 'car' | 'cargo' | 'general' | 'water' | 'commercial';
  length?: number; // мм
  volume?: number; // м³
  weight?: number; // кг
  rawQuery: string;
  cleanQuery: string; // Очищенный запрос без распознанных параметров
}

/**
 * Парсит поисковый запрос и извлекает структурированные данные
 * 
 * Примеры:
 * - "лодка 4м" → category: 'boat', length: 4000
 * - "снегоход 3.5м" → category: 'snowmobile', length: 3500
 * - "груз 10 куб м" → category: 'cargo', volume: 10
 * - "авто 3 тонны" → category: 'car', weight: 3000
 * - "фургон 5 кубов" → category: 'commercial', volume: 5
 * - "бортовой" → category: 'general'
 */
export function parseSearchQuery(query: string): ParsedSearch {
  const lower = query.toLowerCase().trim();
  const result: ParsedSearch = {
    rawQuery: query,
    cleanQuery: query
  };

  // === 1. Определение категории ===
  
  // Категории техники (для конфигуратора)
  // Лодочные прицепы: лодка, катер, надувная лодка, ПВХ лодка
  if (lower.match(/лодк|катер|boat|яхт|гидро|пвх|надувн/)) {
    result.category = 'boat';
  } 
  // Универсальные прицепы: снегоход, ATV, UTV, вездеход, квадроцикл
  else if (lower.match(/снегоход|snowmobile|буран|тайга|atv|utv|вездеход|квадр/)) {
    result.category = 'snowmobile'; // snowmobile как общая категория для универсальных
  } else if (lower.match(/мото|motorcycle|bike|байк/)) {
    result.category = 'motorcycle';
  } else if (lower.match(/авто|машин|car|автомобиль|эвакуат/)) {
    result.category = 'car';
  } else if (lower.match(/груз|cargo|поклаж|тонн/)) {
    result.category = 'cargo';
  }
  // Категории прицепов (для каталога)
  else if (lower.match(/лодочн|водн/)) {
    result.category = 'water';
  } else if (lower.match(/фургон|коммерч|будк/)) {
    result.category = 'commercial';
  } else if (lower.match(/бортов|универсал|общ/)) {
    result.category = 'general';
  }

  // === 2. Определение объёма (приоритет перед длиной) ===
  // Варианты: 10 куб м, 5 м³, 3 м3, 3 куба, 5 кубов, 10 кубометров, просто "5 кубов"
  const volumePatterns = [
    /(\d+[.,]?\d*)\s*(куб\.?\s*м|м³|м3|кубометр\w*)/i,  // 10 куб м, 5 м³, 10 кубометров
    /(\d+[.,]?\d*)\s*(куб[аов]*)(?:\s|$|,|\.)/i, // 3 куба, 5 кубов, 10 куб
  ];
  
  for (const pattern of volumePatterns) {
    const volumeMatch = lower.match(pattern);
    if (volumeMatch) {
      result.volume = parseFloat(volumeMatch[1].replace(',', '.'));
      // Если нашли объём и категория не задана - грузы
      if (!result.category) result.category = 'cargo';
      break;
    }
  }

  // === 3. Определение веса ===
  // Варианты: 3 тонны, 2т, 1500 кг, 1.5 т
  const weightPatterns = [
    /(\d+[.,]?\d*)\s*(тонн[аы]?|т(?:\s|$|,|\.))/,  // 3 тонны, 2т, 1.5 т
    /(\d+[.,]?\d*)\s*(кг|kg)/,  // 1500 кг
  ];
  
  for (const pattern of weightPatterns) {
    const weightMatch = lower.match(pattern);
    if (weightMatch) {
      let val = parseFloat(weightMatch[1].replace(',', '.'));
      const unit = weightMatch[2];
      
      // Конвертируем в кг
      if (unit.match(/тонн|т(?:\s|$|,|\.)/)) {
        val *= 1000;
      }
      result.weight = Math.round(val);
      
      // Если нашли вес и категория не задана - грузы
      if (!result.category) result.category = 'cargo';
      break;
    }
  }

  // === 4. Определение длины (только если не найден объём/вес) ===
  if (!result.volume && !result.weight) {
    // Варианты: 3.5м, 4 м, 350см, 3500мм, 3,5 метра, просто 4.5
    const lengthPatterns = [
      /(\d+[.,]?\d*)\s*(метр[аов]?|м(?:\s|$|,|\.))/,  // 3.5м, 4 метра
      /(\d+[.,]?\d*)\s*(см|сантиметр)/,  // 350см
      /(\d+[.,]?\d*)\s*(мм|миллиметр)/,  // 3500мм
      /(\d+[.,]\d+)(?:\s|$)/, // 3.5 или 3,5 (без единиц - метры)
    ];
    
    for (const pattern of lengthPatterns) {
      const lengthMatch = lower.match(pattern);
      if (lengthMatch) {
        let val = parseFloat(lengthMatch[1].replace(',', '.'));
        const unit = lengthMatch[2] || '';
        
        // Конвертируем в мм
        if (unit.match(/метр|м(?:\s|$|,|\.)/)) {
          val *= 1000;
        } else if (unit.match(/см|сантиметр/)) {
          val *= 10;
        } else if (unit.match(/мм|миллиметр/)) {
          // уже мм
        } else {
          // Эвристика для чисел без единиц
          if (val < 20) val *= 1000; // вероятно метры (3.5 → 3500)
          else if (val < 1000) val *= 10; // вероятно см (350 → 3500)
          // иначе уже мм
        }
        
        result.length = Math.round(val);
        break;
      }
    }
  }

  // === 5. Очистка запроса от распознанных параметров ===
  let cleanQuery = lower;
  // Удаляем распознанные категории
  cleanQuery = cleanQuery.replace(/лодк[аиу]?|катер[аы]?|boat|яхт[аы]?|гидро\w*/g, '');
  cleanQuery = cleanQuery.replace(/снегоход[аы]?|snowmobile|буран|тайга/g, '');
  cleanQuery = cleanQuery.replace(/квадро\w*|atv|вездеход[аы]?/g, '');
  cleanQuery = cleanQuery.replace(/мото\w*|motorcycle|bike|байк[аи]?/g, '');
  cleanQuery = cleanQuery.replace(/авто\w*|машин[аы]?|car|автомобил[ья]?|эвакуат\w*/g, '');
  cleanQuery = cleanQuery.replace(/груз[аы]?|cargo|поклаж[аи]?/g, '');
  cleanQuery = cleanQuery.replace(/лодочн\w*|водн\w*/g, '');
  cleanQuery = cleanQuery.replace(/фургон[аы]?|коммерч\w*|будк[аи]?/g, '');
  cleanQuery = cleanQuery.replace(/бортов\w*|универсал\w*|общ\w*/g, '');
  
  // Удаляем числа с единицами
  cleanQuery = cleanQuery.replace(/\d+[.,]?\d*\s*(куб\.?\s*м|м³|м3|кубометр\w*|куб[аов]?\s)/g, '');
  cleanQuery = cleanQuery.replace(/\d+[.,]?\d*\s*(тонн[аы]?|т\s|кг|kg)/g, '');
  cleanQuery = cleanQuery.replace(/\d+[.,]?\d*\s*(метр\w*|м\s|см|сантиметр\w*|мм|миллиметр\w*)/g, '');
  cleanQuery = cleanQuery.replace(/\d+[.,]\d+/g, ''); // дробные числа
  
  result.cleanQuery = cleanQuery.trim().replace(/\s+/g, ' ');

  return result;
}

/**
 * Определяет категорию прицепа по категории техники
 */
export function mapVehicleCategoryToTrailerCategory(vehicleCategory: string): string | undefined {
  switch (vehicleCategory) {
    case 'boat':
      return 'water';
    case 'car':
    case 'cargo':
      return 'commercial';
    case 'snowmobile':
    case 'atv':
    case 'motorcycle':
      return 'general';
    default:
      return undefined;
  }
}
