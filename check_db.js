const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './backend/database.sqlite',
  logging: false
});

async function check() {
  try {
    const [results] = await sequelize.query("SELECT count(*) as count FROM Trailers WHERE category = 'water'");
    console.log('Water trailers count:', results[0].count);
    
    const [accessories] = await sequelize.query("SELECT count(*) as count FROM Accessories");
    console.log('Accessories count:', accessories[0].count);

    const [sample] = await sequelize.query("SELECT * FROM Trailers WHERE category = 'water' LIMIT 1");
    console.log('Sample water trailer:', JSON.stringify(sample[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}

check();
