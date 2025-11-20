const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('new', 'processing', 'shipping', 'ready', 'completed', 'cancelled'),
    defaultValue: 'new'
  },

  // Итоговая цена (выносим в отдельную колонку для удобства фильтрации)
  totalPrice: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Customer Snapshot (храним как JSON для простоты, или можно выделить в таблицу)
  customer: {
    type: DataTypes.JSON,
    allowNull: false
  },
  
  // Configuration Snapshot
  // Содержит:
  // - trailer: { ..., image: 'url', gallery: [...] } (Фотографии товара тут)
  // - accessories: [{ ..., image: 'url' }] (Опции и их фото)
  // - totalPrice: number
  configuration: {
    type: DataTypes.JSON,
    allowNull: false
  },
  
  // Delivery Info
  delivery: {
    type: DataTypes.JSON,
    allowNull: false
  },
  
  // Timeline
  timeline: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  
  notes: {
    type: DataTypes.TEXT
  },
  manager: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (order) => {
      // Автоматически заполняем totalPrice из конфигурации, если он не передан явно
      if (order.configuration && order.configuration.totalPrice && !order.totalPrice) {
        order.totalPrice = order.configuration.totalPrice;
      }
    }
  }
});

module.exports = Order;
