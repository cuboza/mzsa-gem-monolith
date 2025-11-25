const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database');

// Models
const Trailer = require('./models/Trailer');
const Accessory = require('./models/Accessory');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const Settings = require('./models/Settings');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const { Op } = require('sequelize');

// --- CRUD Helpers ---
const createCrud = (app, path, Model) => {
  // GET All
  app.get(path, async (req, res) => {
    try {
      let where = {};
      
      // Support standard filtering (e.g. ?category=loading)
      if (req.query.category) {
        where.category = req.query.category;
      }
      
      // Generic text search
      if (req.query.q) {
         where[Op.or] = [
           { name: { [Op.like]: `%${req.query.q}%` } }
         ];
      }

      const items = await Model.findAll({ where });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // GET One
  app.get(`${path}/:id`, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (item) res.json(item);
      else res.status(404).json({ error: 'Not found' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST
  app.post(path, async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT
  app.put(`${path}/:id`, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (item) {
        await item.update(req.body);
        res.json(item);
      } else {
        // If not found, create it (upsert-like behavior for json-server compatibility)
        const newItem = await Model.create({ ...req.body, id: req.params.id });
        res.json(newItem);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // PATCH
  app.patch(`${path}/:id`, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (item) {
        await item.update(req.body);
        res.json(item);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`${path}/:id`, async (req, res) => {
    try {
      const item = await Model.findByPk(req.params.id);
      if (item) {
        await item.destroy();
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

// --- Routes ---
// Custom routes for Trailers with smart search
app.get('/trailers', async (req, res) => {
  try {
    let where = {};
    
    // Smart Search Logic for Trailers
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      const conditions = [];
      
      // 1. Detect Category
      if (q.includes('лодк') || q.includes('катер') || q.includes('boat') || q.includes('water')) {
        conditions.push({ category: 'water' });
      } else if (q.includes('снегоход') || q.includes('snowmobile')) {
         conditions.push({ 
           [Op.or]: [
             { category: 'moto' },
             sequelize.where(sequelize.fn('lower', sequelize.col('compatibility')), 'LIKE', '%snowmobile%')
           ]
         });
      } else if (q.includes('квадроцикл') || q.includes('atv')) {
         conditions.push({ 
           [Op.or]: [
             { category: 'moto' },
             sequelize.where(sequelize.fn('lower', sequelize.col('compatibility')), 'LIKE', '%atv%')
           ]
         });
      }

      // 2. Detect Dimensions
      const dimMatch = q.match(/(\d+(?:[.,]\d+)?)\s*[xх×*]\s*(\d+(?:[.,]\d+)?)/);
      if (dimMatch) {
           let l = parseFloat(dimMatch[1].replace(',', '.'));
           let w = parseFloat(dimMatch[2].replace(',', '.'));
           
           if (l < 10) l *= 1000;
           if (w < 10) w *= 1000;
           
           conditions.push({
               innerLength: { [Op.gte]: l },
               innerWidth: { [Op.gte]: w }
           });
      } 
      else {
          const lengthMatch = q.match(/(\d+[.,]?\d*)\s*(м|m|см|cm|мм|mm)/);
          if (lengthMatch) {
            let val = parseFloat(lengthMatch[1].replace(',', '.'));
            const unit = lengthMatch[2];
            
            if (unit.startsWith('м') || unit === 'm') val *= 1000;
            if (unit.startsWith('с') || unit === 'cm') val *= 10;
            
            conditions.push({
              innerLength: { [Op.gte]: val }
            });
          }
      }

      // 3. General Text Search if no specific filters found
      if (conditions.length === 0) {
           conditions.push({
              [Op.or]: [
                  { name: { [Op.like]: `%${req.query.q}%` } },
                  { model: { [Op.like]: `%${req.query.q}%` } }
              ]
           });
      }
      
      if (conditions.length > 0) {
          where = { [Op.and]: conditions };
      }
    }
    
    // Support standard filtering (e.g. ?category=water)
    if (req.query.category) {
      where.category = req.query.category;
    }

    const items = await Trailer.findAll({ where });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/trailers/:id', async (req, res) => {
  try {
    const item = await Trailer.findByPk(req.params.id);
    if (item) res.json(item);
    else res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/trailers', async (req, res) => {
  try {
    const item = await Trailer.create(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/trailers/:id', async (req, res) => {
  try {
    const item = await Trailer.findByPk(req.params.id);
    if (item) {
      await item.update(req.body);
      res.json(item);
    } else {
      const newItem = await Trailer.create({ ...req.body, id: req.params.id });
      res.json(newItem);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/trailers/:id', async (req, res) => {
  try {
    const item = await Trailer.findByPk(req.params.id);
    if (item) {
      await item.update(req.body);
      res.json(item);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/trailers/:id', async (req, res) => {
  try {
    const item = await Trailer.findByPk(req.params.id);
    if (item) {
      await item.destroy();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

createCrud(app, '/accessories', Accessory);
createCrud(app, '/orders', Order);
createCrud(app, '/customers', Customer);

// Settings is special (singleton-ish)
app.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findByPk('default');
    if (!settings) {
        // Return empty or default if not initialized
        return res.json({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/settings', async (req, res) => {
  try {
    let settings = await Settings.findByPk('default');
    if (settings) {
      await settings.update(req.body);
    } else {
      settings = await Settings.create({ ...req.body, id: 'default' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Sync & Start ---
sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
