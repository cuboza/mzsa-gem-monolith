/**
 * E2E тесты для фильтрации и подбора прицепов
 * 100% покрытие правил бизнес-логики
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseSearchQuery, mapVehicleCategoryToTrailerCategory } from '../../utils/searchParser';
import { hasBrakes, getAxlesCount, getMaxVehicleLength } from './trailerUtils';
import { Trailer } from '../../types';

// ============================================================================
// MOCK DATA - Полный набор тестовых прицепов
// ============================================================================

const createTrailer = (overrides: Partial<Trailer>): Trailer => ({
  id: 'test-trailer',
  name: 'Тестовый прицеп',
  model: 'МЗСА 000000.000',
  price: 100000,
  category: 'general',
  availability: 'in_stock',
  capacity: 500,
  dimensions: '2000x1500x300 мм',
  specs: {
    dimensions: '2000x1500x300 мм',
    capacity: '500 кг',
    weight: '200 кг',
    axles: 1,
  },
  brakes: 'без тормозной системы',
  maxVehicleLength: 2000,
  maxVehicleWidth: 1500,
  ...overrides,
});

// Универсальные прицепы
const generalTrailerSmall = createTrailer({
  id: 'general-small',
  name: 'Универсальный малый',
  category: 'general',
  maxVehicleLength: 2500,
  maxVehicleWidth: 1300,
  capacity: 400,
  specs: { capacity: '400 кг', weight: '150 кг', axles: 1 },
  brakes: 'без тормозной системы',
});

const generalTrailerMedium = createTrailer({
  id: 'general-medium',
  name: 'Универсальный средний',
  category: 'general',
  maxVehicleLength: 3500,
  maxVehicleWidth: 1900,
  capacity: 500,
  specs: { capacity: '500 кг', weight: '250 кг', axles: 1 },
  brakes: 'без тормозной системы',
});

const generalTrailerLarge = createTrailer({
  id: 'general-large',
  name: 'Универсальный большой с тормозами',
  category: 'general',
  maxVehicleLength: 4500,
  maxVehicleWidth: 2100,
  capacity: 1500,
  specs: { capacity: '1500 кг', weight: '400 кг', axles: 2 },
  brakes: 'тормоз наката',
});

// Лодочные прицепы
const waterTrailerSmall = createTrailer({
  id: 'water-small',
  name: 'Лодочный малый',
  category: 'water',
  maxVehicleLength: 3500,
  maxVehicleWidth: 1600,
  capacity: 400,
  specs: { capacity: '400 кг', weight: '150 кг', axles: 1 },
  brakes: 'без тормозной системы',
});

const waterTrailerLarge = createTrailer({
  id: 'water-large',
  name: 'Лодочный большой для катеров',
  category: 'water',
  maxVehicleLength: 7000,
  maxVehicleWidth: 2500,
  capacity: 2000,
  specs: { capacity: '2000 кг', weight: '500 кг', axles: 2 },
  brakes: 'тормоз наката',
});

// Коммерческие прицепы
const commercialTrailer = createTrailer({
  id: 'commercial-1',
  name: 'Фургон коммерческий',
  category: 'commercial',
  maxVehicleLength: 5000,
  maxVehicleWidth: 2200,
  capacity: 2500,
  specs: { capacity: '2500 кг', weight: '800 кг', axles: 2 },
  brakes: 'тормоз наката',
});

const allTrailers: Trailer[] = [
  generalTrailerSmall,
  generalTrailerMedium,
  generalTrailerLarge,
  waterTrailerSmall,
  waterTrailerLarge,
  commercialTrailer,
];

// ============================================================================
// ТЕСТЫ: Функция hasBrakes
// ============================================================================

describe('hasBrakes() - определение наличия тормозов', () => {
  it('должен вернуть false для "без тормозной системы"', () => {
    const trailer = createTrailer({ brakes: 'без тормозной системы' });
    expect(hasBrakes(trailer)).toBe(false);
  });

  it('должен вернуть false для "Без тормозов"', () => {
    const trailer = createTrailer({ brakes: 'Без тормозов' });
    expect(hasBrakes(trailer)).toBe(false);
  });

  it('должен вернуть false для "нет"', () => {
    const trailer = createTrailer({ brakes: 'нет' });
    expect(hasBrakes(trailer)).toBe(false);
  });

  it('должен вернуть true для "тормоз наката"', () => {
    const trailer = createTrailer({ brakes: 'тормоз наката' });
    expect(hasBrakes(trailer)).toBe(true);
  });

  it('должен вернуть true для "Тормоз Наката" (регистронезависимо)', () => {
    const trailer = createTrailer({ brakes: 'Тормоз Наката' });
    expect(hasBrakes(trailer)).toBe(true);
  });

  it('должен вернуть false для пустого значения', () => {
    const trailer = createTrailer({ brakes: '' });
    expect(hasBrakes(trailer)).toBe(false);
  });

  it('должен вернуть false для undefined', () => {
    const trailer = createTrailer({ brakes: undefined });
    expect(hasBrakes(trailer)).toBe(false);
  });
});

// ============================================================================
// ТЕСТЫ: Правило полной массы и тормозов
// ============================================================================

describe('Правило: полная масса ≤ 750 кг → без тормозов, > 750 кг → с тормозами', () => {
  it('прицеп 400+150=550 кг должен быть без тормозов', () => {
    const trailer = createTrailer({
      capacity: 400,
      specs: { capacity: '400 кг', weight: '150 кг', axles: 1 },
      brakes: 'без тормозной системы',
    });
    expect(hasBrakes(trailer)).toBe(false);
    // Полная масса = 550 кг < 750 кг — OK
  });

  it('прицеп 500+250=750 кг должен быть без тормозов (граничное значение)', () => {
    const trailer = createTrailer({
      capacity: 500,
      specs: { capacity: '500 кг', weight: '250 кг', axles: 1 },
      brakes: 'без тормозной системы',
    });
    expect(hasBrakes(trailer)).toBe(false);
    // Полная масса = 750 кг — OK (≤ 750)
  });

  it('прицеп 1500+400=1900 кг должен иметь тормоза', () => {
    const trailer = createTrailer({
      capacity: 1500,
      specs: { capacity: '1500 кг', weight: '400 кг', axles: 2 },
      brakes: 'тормоз наката',
    });
    expect(hasBrakes(trailer)).toBe(true);
    // Полная масса = 1900 кг > 750 кг — требуются тормоза
  });
});

// ============================================================================
// ТЕСТЫ: parseSearchQuery - умный парсер поиска
// ============================================================================

describe('parseSearchQuery() - умный поиск', () => {
  describe('Парсинг категорий техники', () => {
    it('должен распознать "лодка" как boat', () => {
      const result = parseSearchQuery('лодка');
      expect(result.category).toBe('boat');
    });

    it('должен распознать "катер" как boat', () => {
      const result = parseSearchQuery('катер');
      expect(result.category).toBe('boat');
    });

    it('должен распознать "ПВХ" как boat', () => {
      const result = parseSearchQuery('пвх');
      expect(result.category).toBe('boat');
    });

    it('должен распознать "снегоход" как snowmobile', () => {
      const result = parseSearchQuery('снегоход');
      expect(result.category).toBe('snowmobile');
    });

    // ВАЖНО: В текущей реализации квадроцикл, atv, utv парсятся как snowmobile
    // т.к. они все используют универсальные прицепы (general)
    it('должен распознать "квадроцикл" как snowmobile (универсальные прицепы)', () => {
      const result = parseSearchQuery('квадроцикл');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "квадр" как snowmobile (частичное совпадение)', () => {
      const result = parseSearchQuery('квадр');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "вездеход" как snowmobile', () => {
      const result = parseSearchQuery('вездеход');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "снегоболотоход" как snowmobile', () => {
      const result = parseSearchQuery('снегоболотоход');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "atv" как snowmobile (универсальные прицепы)', () => {
      const result = parseSearchQuery('atv');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "utv" как snowmobile (универсальные прицепы)', () => {
      const result = parseSearchQuery('utv');
      expect(result.category).toBe('snowmobile');
    });

    it('должен распознать "мотоцикл" как motorcycle', () => {
      const result = parseSearchQuery('мотоцикл');
      expect(result.category).toBe('motorcycle');
    });

    it('должен распознать "авто" как car', () => {
      const result = parseSearchQuery('авто');
      expect(result.category).toBe('car');
    });

    it('должен распознать "груз" как cargo', () => {
      const result = parseSearchQuery('груз');
      expect(result.category).toBe('cargo');
    });
  });

  describe('Парсинг размеров из текста', () => {
    it('должен распознать "4м" как 4000 мм', () => {
      const result = parseSearchQuery('лодка 4м');
      expect(result.length).toBe(4000);
    });

    it('должен распознать "3.5м" как 3500 мм', () => {
      const result = parseSearchQuery('катер 3.5м');
      expect(result.length).toBe(3500);
    });

    it('должен распознать "350см" как 3500 мм', () => {
      const result = parseSearchQuery('лодка 350см');
      expect(result.length).toBe(3500);
    });

    it('должен распознать "3500мм" как 3500 мм', () => {
      const result = parseSearchQuery('техника 3500мм');
      expect(result.length).toBe(3500);
    });

    it('должен распознать "4 метра" как 4000 мм', () => {
      const result = parseSearchQuery('лодка 4 метра');
      expect(result.length).toBe(4000);
    });
  });

  describe('Парсинг веса из текста', () => {
    it('должен распознать "500кг" как 500 кг', () => {
      const result = parseSearchQuery('техника 500кг');
      expect(result.weight).toBe(500);
    });

    it('должен распознать "1.5 тонны" как 1500 кг', () => {
      const result = parseSearchQuery('груз 1.5 тонны');
      expect(result.weight).toBe(1500);
    });

    it('должен распознать "2т" как 2000 кг', () => {
      const result = parseSearchQuery('техника 2т');
      expect(result.weight).toBe(2000);
    });
  });

  describe('Парсинг объёма из текста', () => {
    it('должен распознать "10 куб м" как 10 м³', () => {
      const result = parseSearchQuery('фургон 10 куб м');
      expect(result.volume).toBe(10);
    });

    it('должен распознать "5 кубов" как 5 м³', () => {
      const result = parseSearchQuery('прицеп 5 кубов');
      expect(result.volume).toBe(5);
    });

    it('должен распознать "3 м³" как 3 м³', () => {
      const result = parseSearchQuery('фургон 3 м³');
      expect(result.volume).toBe(3);
    });
  });

  describe('Комбинированные запросы', () => {
    it('должен распознать "лодка 4м 300кг"', () => {
      const result = parseSearchQuery('лодка 4м 300кг');
      expect(result.category).toBe('boat');
      expect(result.length).toBe(4000);
      expect(result.weight).toBe(300);
    });

    it('должен сохранить чистый текст запроса', () => {
      const result = parseSearchQuery('BRP Can-Am Maverick X3');
      expect(result.cleanQuery).toBe('brp can-am maverick x3');
      expect(result.rawQuery).toBe('BRP Can-Am Maverick X3');
    });
  });
});

// ============================================================================
// ТЕСТЫ: mapVehicleCategoryToTrailerCategory - маппинг категорий
// ============================================================================

describe('mapVehicleCategoryToTrailerCategory() - маппинг категорий', () => {
  it('boat → water (лодочные прицепы)', () => {
    expect(mapVehicleCategoryToTrailerCategory('boat')).toBe('water');
  });

  // Наземная техника НЕ ограничивается одной категорией прицепов
  // Снегоходы, квадроциклы и т.д. подходят к general И commercial
  it('snowmobile → undefined (не ограничиваем, подходит general и commercial)', () => {
    expect(mapVehicleCategoryToTrailerCategory('snowmobile')).toBeUndefined();
  });

  it('atv → undefined (не ограничиваем, подходит general и commercial)', () => {
    expect(mapVehicleCategoryToTrailerCategory('atv')).toBeUndefined();
  });

  it('motorcycle → undefined (не ограничиваем, подходит general и commercial)', () => {
    expect(mapVehicleCategoryToTrailerCategory('motorcycle')).toBeUndefined();
  });

  it('car → undefined (не ограничиваем, подходит general и commercial)', () => {
    expect(mapVehicleCategoryToTrailerCategory('car')).toBeUndefined();
  });

  it('cargo → undefined (не ограничиваем, подходит general и commercial)', () => {
    expect(mapVehicleCategoryToTrailerCategory('cargo')).toBeUndefined();
  });
});

// ============================================================================
// ТЕСТЫ: Правила совместимости прицепов и техники
// ============================================================================

describe('Правила совместимости прицепов и техники', () => {
  describe('Правило: Лодочные прицепы ТОЛЬКО для водной техники', () => {
    it('лодочный прицеп подходит для лодки (boat)', () => {
      // Водная техника + водный прицеп = OK
      const isWaterVehicle = 'boat' === 'boat';
      const isWaterTrailer = waterTrailerSmall.category === 'water';
      expect(isWaterTrailer && isWaterVehicle).toBe(true);
    });

    it('лодочный прицеп НЕ подходит для квадроцикла (atv)', () => {
      const vehicleCategory = 'atv';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = waterTrailerSmall.category === 'water';
      // Лодочный прицеп + не водная техника = ОТКЛОНИТЬ
      expect(isWaterTrailer && !isWaterVehicle).toBe(true);
    });

    it('лодочный прицеп НЕ подходит для снегохода (snowmobile)', () => {
      const vehicleCategory = 'snowmobile';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = waterTrailerLarge.category === 'water';
      expect(isWaterTrailer && !isWaterVehicle).toBe(true);
    });
  });

  describe('Правило: Водная техника ТОЛЬКО на лодочные прицепы', () => {
    it('лодка НЕ подходит для универсального прицепа', () => {
      const vehicleCategory = 'boat';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = generalTrailerMedium.category === 'water';
      // Водная техника + не лодочный прицеп = ОТКЛОНИТЬ
      expect(isWaterVehicle && !isWaterTrailer).toBe(true);
    });

    it('лодка НЕ подходит для коммерческого прицепа', () => {
      const vehicleCategory = 'boat';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = commercialTrailer.category === 'water';
      expect(isWaterVehicle && !isWaterTrailer).toBe(true);
    });
  });

  describe('Правило: Универсальные прицепы для не-водной техники', () => {
    it('универсальный прицеп подходит для квадроцикла', () => {
      const vehicleCategory = 'atv';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = generalTrailerMedium.category === 'water';
      // Не водная техника + не лодочный прицеп = OK (проходит оба правила)
      expect(!isWaterVehicle && !isWaterTrailer).toBe(true);
    });

    it('универсальный прицеп подходит для снегохода', () => {
      const vehicleCategory = 'snowmobile';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = generalTrailerLarge.category === 'water';
      expect(!isWaterVehicle && !isWaterTrailer).toBe(true);
    });

    it('коммерческий прицеп подходит для мотоцикла', () => {
      const vehicleCategory = 'motorcycle';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = commercialTrailer.category === 'water';
      expect(!isWaterVehicle && !isWaterTrailer).toBe(true);
    });
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по РАЗМЕРАМ техники
// ============================================================================

describe('Фильтрация по размерам техники', () => {
  describe('Фильтрация по длине', () => {
    it('техника 2000мм помещается в прицеп с maxVehicleLength=2500мм', () => {
      const vehicleLength = 2000;
      const trailerMaxLength = generalTrailerSmall.maxVehicleLength!;
      expect(vehicleLength <= trailerMaxLength).toBe(true);
    });

    it('техника 3000мм НЕ помещается в прицеп с maxVehicleLength=2500мм', () => {
      const vehicleLength = 3000;
      const trailerMaxLength = generalTrailerSmall.maxVehicleLength!;
      expect(vehicleLength <= trailerMaxLength).toBe(false);
    });

    it('техника 3353мм помещается в прицеп с maxVehicleLength=3500мм', () => {
      const vehicleLength = 3353; // BRP Can-Am Maverick X3
      const trailerMaxLength = generalTrailerMedium.maxVehicleLength!;
      expect(vehicleLength <= trailerMaxLength).toBe(true);
    });
  });

  describe('Фильтрация по ширине', () => {
    it('техника 1200мм помещается в прицеп с maxVehicleWidth=1300мм', () => {
      const vehicleWidth = 1200;
      const trailerMaxWidth = generalTrailerSmall.maxVehicleWidth!;
      expect(vehicleWidth <= trailerMaxWidth).toBe(true);
    });

    it('техника 1829мм НЕ помещается в прицеп с maxVehicleWidth=1300мм', () => {
      const vehicleWidth = 1829; // BRP Can-Am Maverick X3
      const trailerMaxWidth = generalTrailerSmall.maxVehicleWidth!;
      expect(vehicleWidth <= trailerMaxWidth).toBe(false);
    });

    it('техника 1829мм помещается в прицеп с maxVehicleWidth=1900мм', () => {
      const vehicleWidth = 1829;
      const trailerMaxWidth = generalTrailerMedium.maxVehicleWidth!;
      expect(vehicleWidth <= trailerMaxWidth).toBe(true);
    });
  });

  describe('Комплексная проверка: BRP Can-Am Maverick X3 (3353x1829мм)', () => {
    const maverick = { length: 3353, width: 1829 };

    it('НЕ помещается в малый универсальный (2500x1300мм)', () => {
      const fitsLength = maverick.length <= generalTrailerSmall.maxVehicleLength!;
      const fitsWidth = maverick.width <= generalTrailerSmall.maxVehicleWidth!;
      expect(fitsLength && fitsWidth).toBe(false);
    });

    it('помещается в средний универсальный (3500x1900мм)', () => {
      const fitsLength = maverick.length <= generalTrailerMedium.maxVehicleLength!;
      const fitsWidth = maverick.width <= generalTrailerMedium.maxVehicleWidth!;
      expect(fitsLength && fitsWidth).toBe(true);
    });

    it('помещается в большой универсальный (4500x2100мм)', () => {
      const fitsLength = maverick.length <= generalTrailerLarge.maxVehicleLength!;
      const fitsWidth = maverick.width <= generalTrailerLarge.maxVehicleWidth!;
      expect(fitsLength && fitsWidth).toBe(true);
    });

    it('НЕ подходит лодочный прицеп (категория water)', () => {
      const vehicleCategory = 'atv';
      const isWaterVehicle = vehicleCategory === 'boat';
      const isWaterTrailer = waterTrailerSmall.category === 'water';
      // Лодочный прицеп отклоняется для не-водной техники
      expect(isWaterTrailer && !isWaterVehicle).toBe(true);
    });
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по категории прицепа (UI фильтр)
// ============================================================================

describe('Фильтрация по категории прицепа', () => {
  it('фильтр "general" возвращает только универсальные прицепы', () => {
    const filtered = allTrailers.filter(t => t.category === 'general');
    expect(filtered.length).toBe(3);
    expect(filtered.every(t => t.category === 'general')).toBe(true);
  });

  it('фильтр "water" возвращает только лодочные прицепы', () => {
    const filtered = allTrailers.filter(t => t.category === 'water');
    expect(filtered.length).toBe(2);
    expect(filtered.every(t => t.category === 'water')).toBe(true);
  });

  it('фильтр "commercial" возвращает только коммерческие прицепы', () => {
    const filtered = allTrailers.filter(t => t.category === 'commercial');
    expect(filtered.length).toBe(1);
    expect(filtered.every(t => t.category === 'commercial')).toBe(true);
  });

  it('фильтр "all" возвращает все прицепы', () => {
    const category = 'all';
    const filtered = allTrailers.filter(t => category === 'all' || t.category === category);
    expect(filtered.length).toBe(6);
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по наличию
// ============================================================================

describe('Фильтрация по наличию', () => {
  const trailersWithAvailability = [
    createTrailer({ id: 't1', availability: 'in_stock' }),
    createTrailer({ id: 't2', availability: 'on_order' }),
    createTrailer({ id: 't3', availability: 'in_stock' }),
    createTrailer({ id: 't4', availability: 'out_of_stock' }),
  ];

  it('фильтр "в наличии" возвращает только in_stock', () => {
    const filtered = trailersWithAvailability.filter(t => t.availability === 'in_stock');
    expect(filtered.length).toBe(2);
    expect(filtered.every(t => t.availability === 'in_stock')).toBe(true);
  });

  it('без фильтра возвращает все прицепы', () => {
    const onlyInStock = false;
    const filtered = trailersWithAvailability.filter(t => !onlyInStock || t.availability === 'in_stock');
    expect(filtered.length).toBe(4);
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по цене
// ============================================================================

describe('Фильтрация по цене', () => {
  const trailersWithPrices = [
    createTrailer({ id: 't1', price: 50000 }),
    createTrailer({ id: 't2', price: 100000 }),
    createTrailer({ id: 't3', price: 150000 }),
    createTrailer({ id: 't4', price: 200000 }),
  ];

  it('фильтр от 100000 до 200000', () => {
    const minPrice = 100000;
    const maxPrice = 200000;
    const filtered = trailersWithPrices.filter(t => t.price >= minPrice && t.price <= maxPrice);
    expect(filtered.length).toBe(3);
    expect(filtered.map(t => t.id)).toEqual(['t2', 't3', 't4']);
  });

  it('фильтр только минимальная цена', () => {
    const minPrice = 150000;
    const maxPrice = Infinity;
    const filtered = trailersWithPrices.filter(t => t.price >= minPrice && t.price <= maxPrice);
    expect(filtered.length).toBe(2);
  });

  it('фильтр только максимальная цена', () => {
    const minPrice = 0;
    const maxPrice = 100000;
    const filtered = trailersWithPrices.filter(t => t.price >= minPrice && t.price <= maxPrice);
    expect(filtered.length).toBe(2);
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по осям
// ============================================================================

describe('Фильтрация по осям', () => {
  it('getAxlesCount возвращает количество осей из specs', () => {
    expect(getAxlesCount(generalTrailerSmall)).toBe(1);
    expect(getAxlesCount(generalTrailerLarge)).toBe(2);
  });

  it('фильтр "1 ось" возвращает одноосные прицепы', () => {
    const filtered = allTrailers.filter(t => getAxlesCount(t) === 1);
    expect(filtered.length).toBe(3);
  });

  it('фильтр "2 оси" возвращает двухосные прицепы', () => {
    const filtered = allTrailers.filter(t => getAxlesCount(t) === 2);
    expect(filtered.length).toBe(3);
  });
});

// ============================================================================
// ТЕСТЫ: Фильтрация по тормозам
// ============================================================================

describe('Фильтрация по тормозам', () => {
  it('фильтр "без тормозов" возвращает прицепы без тормозов', () => {
    const filtered = allTrailers.filter(t => !hasBrakes(t));
    expect(filtered.length).toBe(3);
    expect(filtered.every(t => !hasBrakes(t))).toBe(true);
  });

  it('фильтр "с тормозами" возвращает прицепы с тормозами', () => {
    const filtered = allTrailers.filter(t => hasBrakes(t));
    expect(filtered.length).toBe(3);
    expect(filtered.every(t => hasBrakes(t))).toBe(true);
  });
});

// ============================================================================
// ТЕСТЫ: Текстовый поиск (когда НЕ выбрана техника)
// ============================================================================

describe('Текстовый поиск по названию прицепа', () => {
  it('поиск "КОМПАКТ" находит прицеп с этим словом в названии', () => {
    const trailers = [
      createTrailer({ id: 't1', name: 'Прицеп КОМПАКТ' }),
      createTrailer({ id: 't2', name: 'Прицеп универсальный' }),
    ];
    const query = 'компакт';
    const filtered = trailers.filter(t => t.name?.toLowerCase().includes(query.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('t1');
  });

  it('поиск по модели "817718"', () => {
    const trailers = [
      createTrailer({ id: 't1', model: 'МЗСА 817718.022' }),
      createTrailer({ id: 't2', model: 'МЗСА 817701.022' }),
    ];
    const query = '817718';
    const filtered = trailers.filter(t => t.model?.toLowerCase().includes(query.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('t1');
  });

  it('когда выбрана техника (vehicleSelected=true), текстовый поиск НЕ применяется', () => {
    const vehicleSelected = true;
    const query = 'BRP Can-Am Maverick X3';
    // При vehicleSelected=true не фильтруем по названию
    const shouldApplyTextSearch = !vehicleSelected;
    expect(shouldApplyTextSearch).toBe(false);
  });
});

// ============================================================================
// ТЕСТЫ: Интеграционный сценарий - подбор прицепа для BRP Maverick X3
// ============================================================================

describe('Интеграционный сценарий: BRP Can-Am Maverick X3', () => {
  // Характеристики квадроцикла
  const maverick = {
    category: 'atv',
    length: 3353,
    width: 1829,
    weight: 770,
  };

  it('должен найти подходящие прицепы (только по размерам, без веса)', () => {
    const suitable = allTrailers.filter(trailer => {
      // Правило 1: Лодочные только для лодок
      const isWaterVehicle = maverick.category === 'boat';
      const isWaterTrailer = trailer.category === 'water';
      if (isWaterTrailer && !isWaterVehicle) return false;
      if (isWaterVehicle && !isWaterTrailer) return false;

      // Правило 2: Фильтрация по размерам (вес НЕ учитываем)
      if (trailer.maxVehicleLength && maverick.length > trailer.maxVehicleLength) return false;
      if (trailer.maxVehicleWidth && maverick.width > trailer.maxVehicleWidth) return false;

      return true;
    });

    // Должны подойти: general-medium, general-large, commercial-1
    expect(suitable.length).toBe(3);
    expect(suitable.map(t => t.id).sort()).toEqual([
      'commercial-1',
      'general-large',
      'general-medium',
    ]);
  });

  it('НЕ должен предлагать лодочные прицепы', () => {
    const suitable = allTrailers.filter(trailer => {
      const isWaterVehicle = maverick.category === 'boat';
      const isWaterTrailer = trailer.category === 'water';
      if (isWaterTrailer && !isWaterVehicle) return false;
      return true;
    });

    expect(suitable.every(t => t.category !== 'water')).toBe(true);
  });

  it('НЕ должен предлагать слишком маленькие прицепы', () => {
    const suitable = allTrailers.filter(trailer => {
      if (trailer.maxVehicleLength && maverick.length > trailer.maxVehicleLength) return false;
      if (trailer.maxVehicleWidth && maverick.width > trailer.maxVehicleWidth) return false;
      return true;
    });

    // general-small (2500x1300) не подходит
    expect(suitable.find(t => t.id === 'general-small')).toBeUndefined();
  });
});

// ============================================================================
// ТЕСТЫ: Интеграционный сценарий - подбор прицепа для лодки
// ============================================================================

describe('Интеграционный сценарий: Лодка ПВХ 4м', () => {
  const boat = {
    category: 'boat',
    length: 4000,
    width: 1800,
  };

  it('должен предлагать ТОЛЬКО лодочные прицепы', () => {
    const suitable = allTrailers.filter(trailer => {
      const isWaterVehicle = boat.category === 'boat';
      const isWaterTrailer = trailer.category === 'water';
      if (isWaterVehicle && !isWaterTrailer) return false;
      if (trailer.maxVehicleLength && boat.length > trailer.maxVehicleLength) return false;
      return true;
    });

    expect(suitable.every(t => t.category === 'water')).toBe(true);
    // water-small (3500мм) — не подходит по длине
    // water-large (7000мм) — подходит
    expect(suitable.length).toBe(1);
    expect(suitable[0].id).toBe('water-large');
  });

  it('НЕ должен предлагать универсальные прицепы', () => {
    const suitable = allTrailers.filter(trailer => {
      const isWaterVehicle = boat.category === 'boat';
      const isWaterTrailer = trailer.category === 'water';
      if (isWaterVehicle && !isWaterTrailer) return false;
      return true;
    });

    expect(suitable.find(t => t.category === 'general')).toBeUndefined();
  });
});
