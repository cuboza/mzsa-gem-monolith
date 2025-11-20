const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  region: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  orders: {
    type: DataTypes.JSON, // Array of Order IDs
    defaultValue: []
  },
  totalSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastOrderAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

module.exports = Customer;
