const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: 'default'
  },
  contacts: {
    type: DataTypes.JSON
  },
  delivery: {
    type: DataTypes.JSON
  },
  about: {
    type: DataTypes.JSON
  }
}, {
  timestamps: true
});

module.exports = Settings;
