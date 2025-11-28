import { Vehicle } from '../types';
import rmVehiclesRaw from './vehicles_rm.json';

const rmSnowmobiles = rmVehiclesRaw
  .filter(v => ['Фронтьер', 'Тайга', 'Буран', 'Тикси'].some(k => v.model.includes(k)))
  .map(v => ({
    brand: v.brand,
    model: v.model,
    length: v.length,
    width: v.width,
    height: v.height,
    weight: v.weight || 300, // Default if 0
    loadingAngle: 20,
    tiePoints: "standard"
  }));

const rmAtvs = rmVehiclesRaw
  .filter(v => ['РМ 800', 'РМ 650', 'РМ 500'].some(k => v.model.includes(k)))
  .map(v => ({
    brand: v.brand,
    model: v.model,
    length: v.length,
    width: v.width,
    height: v.height,
    weight: v.weight || 400, // Default if 0
    loadingAngle: 25,
    tiePoints: "front_rear"
  }));

export const vehicleDatabase: Record<string, Vehicle[]> = {
  snowmobile: [
    {
      brand: "Ski-Doo",
      model: "MXZ X-RS 850",
      length: 3200,
      width: 1150,
      height: 1350,
      weight: 225,
      loadingAngle: 18,
      tiePoints: "standard"
    },
    ...rmSnowmobiles,
    {
      brand: "Arctic Cat",
      model: "ZR 8000",
      length: 3050,
      width: 1200,
      height: 1300,
      weight: 240,
      loadingAngle: 18,
      tiePoints: "standard"
    },
    {
      brand: "Yamaha",
      model: "VK Professional II",
      length: 3100,
      width: 1200,
      height: 1400,
      weight: 280,
      loadingAngle: 20,
      tiePoints: "standard"
    }
  ],
  boat: [
    {
      brand: "Фрегат",
      model: "М-350 С",
      length: 3500,
      width: 1770,
      height: 470,
      weight: 65,
      loadingAngle: 12,
      tiePoints: "bow_stern"
    },
    {
      brand: "Saturn",
      model: "HD330 ПВХ",
      length: 3300,
      width: 1600,
      height: 500,
      weight: 65,
      loadingAngle: 12,
      tiePoints: "bow_stern"
    },
    {
      brand: "Пеликан",
      model: "280Т",
      length: 2800,
      width: 1400,
      height: 400,
      weight: 35,
      loadingAngle: 10,
      tiePoints: "bow_stern"
    },
    {
      brand: "Посейдон",
      model: "Викинг-340",
      length: 3400,
      width: 1650,
      height: 500,
      weight: 70,
      loadingAngle: 12,
      tiePoints: "bow_stern"
    },
    {
      brand: "Хантер",
      model: "380 ПРО",
      length: 3800,
      width: 1800,
      height: 550,
      weight: 85,
      loadingAngle: 14,
      tiePoints: "bow_stern"
    }
  ],
  atv: [
    ...rmAtvs,
    {
      brand: "Polaris",
      model: "Sportsman 570",
      length: 1980,
      width: 1220,
      height: 1220,
      weight: 320,
      loadingAngle: 25,
      tiePoints: "front_rear"
    },
    {
      brand: "Stels",
      model: "ATV 650 Guepard",
      length: 2100,
      width: 1200,
      height: 1250,
      weight: 340,
      loadingAngle: 25,
      tiePoints: "front_rear"
    },
    {
      brand: "CF Moto",
      model: "X8 H.O. EPS",
      length: 2280,
      width: 1280,
      height: 1320,
      weight: 410,
      loadingAngle: 27,
      tiePoints: "front_rear"
    },
    {
      brand: "Can-Am",
      model: "Outlander 650",
      length: 2050,
      width: 1170,
      height: 1240,
      weight: 340,
      loadingAngle: 25,
      tiePoints: "front_rear"
    }
  ],
  motorcycle: [
    {
      brand: "Урал",
      model: "М-72",
      length: 2400,
      width: 900,
      height: 1100,
      weight: 320,
      loadingAngle: 20,
      tiePoints: "front_rear"
    },
    {
      brand: "Honda",
      model: "Africa Twin",
      length: 2230,
      width: 930,
      height: 1475,
      weight: 238,
      loadingAngle: 18,
      tiePoints: "front_rear"
    },
    {
      brand: "Kawasaki",
      model: "Versys 650",
      length: 2165,
      width: 840,
      height: 1400,

      weight: 216,
      loadingAngle: 18,
      tiePoints: "front_rear"
    }
  ],
  car: [
    {
      brand: "ВАЗ",
      model: "Lada Vesta",
      length: 4410,
      width: 1764,
      height: 1497,
      weight: 1200,
      loadingAngle: 10,
      tiePoints: "standard"
    },
    {
      brand: "Hyundai",
      model: "Solaris",
      length: 4375,
      width: 1729,
      height: 1460,
      weight: 1100,
      loadingAngle: 10,
      tiePoints: "standard"
    },
    {
      brand: "Kia",
      model: "Rio",
      length: 4240,
      width: 1750,
      height: 1470,
      weight: 1150,
      loadingAngle: 10,
      tiePoints: "standard"
    },
    {
      brand: "Toyota",
      model: "Camry",
      length: 4885,
      width: 1840,
      height: 1455,
      weight: 1500,
      loadingAngle: 8,
      tiePoints: "standard"
    },
    {
      brand: "Volkswagen",
      model: "Polo",
      length: 4053,
      width: 1751,
      height: 1461,
      weight: 1080,
      loadingAngle: 10,
      tiePoints: "standard"
    }
  ],
  cargo: [
    {
      brand: "Груз",
      model: "Строительные материалы (1 м³)",
      length: 1000,
      width: 1000,
      height: 1000,
      weight: 500,
      volume: 1
    },
    {
      brand: "Груз",
      model: "Строительные материалы (3 м³)",
      length: 1500,
      width: 1000,
      height: 2000,
      weight: 1500,
      volume: 3
    },
    {
      brand: "Груз",
      model: "Строительные материалы (5 м³)",
      length: 2000,
      width: 1250,
      height: 2000,
      weight: 2500,
      volume: 5
    },
    {
      brand: "Груз",
      model: "Строительные материалы (10 м³)",
      length: 2500,
      width: 2000,
      height: 2000,
      weight: 5000,
      volume: 10
    },
    {
      brand: "Груз",
      model: "Бытовая техника (1 т)",
      length: 1200,
      width: 800,
      height: 1000,
      weight: 1000,
      volume: 1
    },
    {
      brand: "Груз",
      model: "Бытовая техника (2 т)",
      length: 1500,
      width: 1000,
      height: 1500,
      weight: 2000,
      volume: 2.25
    },
    {
      brand: "Груз",
      model: "Оборудование (3 т)",
      length: 2000,
      width: 1200,
      height: 1500,
      weight: 3000,
      volume: 3.6
    },
    {
      brand: "Груз",
      model: "Оборудование (5 т)",
      length: 2500,
      width: 1500,
      height: 2000,
      weight: 5000,
      volume: 7.5
    }
  ]
};