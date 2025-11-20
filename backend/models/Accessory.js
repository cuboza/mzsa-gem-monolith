const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Accessory = sequelize.define('Accessory', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  image: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  compatibleWith: {
    type: DataTypes.JSON,
    defaultValue: ["all"]
  }
}, {
  timestamps: true
});

module.exports = Accessory;
