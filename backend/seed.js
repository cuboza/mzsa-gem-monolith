const sequelize = require('./database');
const Trailer = require('./models/Trailer');
const Accessory = require('./models/Accessory');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const Settings = require('./models/Settings');
const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Re-create tables
    console.log('Database cleared and synced.');

    const dbPath = path.join(__dirname, 'db.json');
    if (!fs.existsSync(dbPath)) {
      console.log('db.json not found, skipping seed.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Trailers
    if (data.trailers) {
      for (const t of data.trailers) {
        // Map fields from old structure to new structure if needed
        // Old structure had 'specs' object, new has flat fields for specs
        // We need to flatten 'specs' if it exists
        const { specs, ...rest } = t;
        
        let flatSpecs = {};
        if (specs) {
            // Try to parse dimensions "5970×2260×1160"
            // This is a bit complex to parse reliably without strict format, 
            // so for now we might just store what we can or keep them null if format doesn't match
            // But wait, our new model has specific fields like innerLength, etc.
            // The old data has 'dimensions' string.
            // Let's just keep the old data as is for the fields that match, 
            // and maybe put the rest in 'features' or ignore for now.
            // Actually, the user asked for a structure for scraper, so the new model is "future proof".
            // The old data might not fit perfectly.
            // Let's try to map what we can.
            
            flatSpecs.payloadCapacity = parseInt(specs.capacity) || rest.capacity;
            flatSpecs.curbWeight = parseInt(specs.weight);
            flatSpecs.axles = specs.axles;
        } else {
            flatSpecs.payloadCapacity = rest.capacity;
        }

        await Trailer.create({
          ...rest,
          ...flatSpecs,
          specs: specs || {}, // Save the full specs object
          // If old data has 'dimensions' string, we can't easily put it into innerLength/Width/Height
          // unless we parse it. For now, let's just save the record.
          // The new model has 'features' as JSON, which matches.
        });
      }
      console.log(`Seeded ${data.trailers.length} trailers.`);
    }

    // Accessories
    if (data.accessories) {
      await Accessory.bulkCreate(data.accessories);
      console.log(`Seeded ${data.accessories.length} accessories.`);
    }

    // Orders
    if (data.orders) {
      await Order.bulkCreate(data.orders);
      console.log(`Seeded ${data.orders.length} orders.`);
    }

    // Customers
    if (data.customers) {
      await Customer.bulkCreate(data.customers);
      console.log(`Seeded ${data.customers.length} customers.`);
    }

    // Settings
    if (data.settings) {
      await Settings.create({ id: 'default', ...data.settings });
      console.log('Seeded settings.');
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
