const sequelize = require('./database');
const Trailer = require('./models/Trailer');

const waterTrailers = [
  {
    model: 'МЗСА 81771С.012',
    name: 'Прицеп «КОМПАКТ» для плоскодонных лодок и лодок ПВХ',
    category: 'water',
    price: 65300,
    grossWeight: 500,
    payloadCapacity: 366,
    outerLength: 4460,
    outerWidth: 1550,
    outerHeight: 1079,
    innerLength: 4300, // Длина судна
    image: 'https://www.mzsa.ru/images/mini/i14014072594cde7bd5eff830e1a814ae1ff4bd.jpg',
    compatibility: ['boat'],
    description: 'Компактный прицеп для перевозки плоскодонных лодок и лодок ПВХ.'
  },
  {
    model: 'МЗСА 81771С.014',
    name: 'Прицеп «КОМПАКТ» для каяков, байдарок и каноэ',
    category: 'water',
    price: 69800,
    grossWeight: 500,
    payloadCapacity: 367,
    outerLength: 4290,
    outerWidth: 1550,
    outerHeight: 1095,
    innerLength: 4100,
    image: 'https://www.mzsa.ru/images/mini/i140140dbda61d23ad125624b758e55008b88fd.jpg',
    compatibility: ['boat', 'kayak'],
    description: 'Специализированный прицеп для перевозки каяков и каноэ.'
  },
  {
    model: 'МЗСА 81771А.101',
    name: 'Прицеп для гидроциклов',
    category: 'water',
    price: 85000,
    grossWeight: 750,
    payloadCapacity: 590,
    outerLength: 3476,
    outerWidth: 1625,
    outerHeight: 942,
    innerLength: 3000,
    image: 'https://www.mzsa.ru/images/mini/i140140ec741d88c1f479ddd455efb728a8595c.jpg',
    compatibility: ['jetski'],
    description: 'Идеальное решение для транспортировки гидроцикла.'
  },
  {
    model: 'МЗСА 81771B.101',
    name: 'Прицеп для гидроциклов и лодок',
    category: 'water',
    price: 86300,
    grossWeight: 750,
    payloadCapacity: 583,
    outerLength: 3976,
    outerWidth: 1625,
    outerHeight: 1163,
    innerLength: 3400,
    image: 'https://www.mzsa.ru/images/mini/i140140551eadde69d4e731f5346db3043c2c8d.jpg',
    compatibility: ['boat', 'jetski'],
    description: 'Универсальный прицеп для небольших лодок и гидроциклов.'
  },
  {
    model: 'МЗСА 81772B.101',
    name: 'Прицеп для двух гидроциклов',
    category: 'water',
    price: 179700,
    grossWeight: 750,
    payloadCapacity: 438,
    outerLength: 5024,
    outerWidth: 2240,
    outerHeight: 1139,
    innerLength: 4500,
    image: 'https://www.mzsa.ru/images/mini/i1401405dc0ccad48da8f3061e141811cd1b84e.jpg',
    compatibility: ['jetski'],
    description: 'Двухосный прицеп для перевозки сразу двух гидроциклов.'
  },
  {
    model: 'МЗСА 81771D.101',
    name: 'Прицеп для лодок и катеров',
    category: 'water',
    price: 88700,
    grossWeight: 750,
    payloadCapacity: 563,
    outerLength: 4976,
    outerWidth: 1965,
    outerHeight: 1163,
    innerLength: 4300,
    image: 'https://www.mzsa.ru/images/mini/i140140dab55f0ab92db6144dbad8454fb62769.jpg',
    compatibility: ['boat'],
    description: 'Популярная модель для лодок длиной до 4.3 метра.'
  },
  {
    model: 'МЗСА 81771E.101',
    name: 'Прицеп для лодок и катеров (удлиненный)',
    category: 'water',
    price: 90000,
    grossWeight: 750,
    payloadCapacity: 554,
    outerLength: 5476,
    outerWidth: 1965,
    outerHeight: 1163,
    innerLength: 4750,
    image: 'https://www.mzsa.ru/images/mini/i140140fb507597fe34465e5e26fcce8a9059a0.jpg',
    compatibility: ['boat'],
    description: 'Для лодок длиной до 4.75 метра.'
  },
  {
    model: 'МЗСА 81771G.021',
    name: 'Прицеп для крупных лодок и катеров',
    category: 'water',
    price: 134000,
    grossWeight: 750,
    payloadCapacity: 480,
    outerLength: 5974,
    outerWidth: 2240,
    outerHeight: 1199,
    innerLength: 5450,
    image: 'https://www.mzsa.ru/images/mini/i140140360dc3ea222d2fbf78a7a71df79d32ff.jpg',
    compatibility: ['boat'],
    description: 'Для судов длиной до 5.45 метра. Усиленная конструкция.'
  },
  {
    model: 'МЗСА L 8022-2.25',
    name: 'Прицеп для катеров и яхт (двухосный)',
    category: 'water',
    price: 423400,
    grossWeight: 2500,
    payloadCapacity: 1814,
    outerLength: 7974,
    outerWidth: 2240,
    outerHeight: 1294,
    innerLength: 7200,
    image: 'https://www.mzsa.ru/images/mini/i140140e5c3d10ed75604e77d775ff61da38ae0.jpg',
    compatibility: ['boat', 'yacht'],
    description: 'Профессиональный прицеп для тяжелых катеров до 7.2 метра.'
  }
];

async function seedWater() {
  try {
    // Don't force sync, just append
    await sequelize.sync(); 
    
    for (const t of waterTrailers) {
      // Check if exists to avoid duplicates
      const exists = await Trailer.findOne({ where: { model: t.model } });
      if (!exists) {
        await Trailer.create({
            ...t,
            id: `water-${Math.random().toString(36).substr(2, 9)}`,
            availability: 'in_stock'
        });
        console.log(`Added ${t.model}`);
      } else {
        console.log(`Skipped ${t.model} (exists)`);
      }
    }
    console.log('Water trailers seeding completed.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await sequelize.close();
  }
}

seedWater();
