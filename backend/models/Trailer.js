const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Trailer = sequelize.define('Trailer', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  // --- Основная информация (Basic Info) ---
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Модель производителя (например, 817701.012)'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Маркетинговое название'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  oldPrice: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  availability: {
    type: DataTypes.ENUM('in_stock', 'days_1_3', 'days_7_14', 'on_order'),
    defaultValue: 'in_stock'
  },
  badge: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // --- Медиа (Media) ---
  image: {
    type: DataTypes.STRING,
    comment: 'Главное изображение'
  },
  gallery: {
    type: DataTypes.JSON, // Массив URL
    defaultValue: []
  },
  
  // --- Данные для скрейпера (Scraper Data) ---
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // --- Физические характеристики (Physical Specs) ---
  grossWeight: {
    type: DataTypes.INTEGER,
    comment: 'Полная масса, кг'
  },
  payloadCapacity: {
    type: DataTypes.INTEGER,
    comment: 'Грузоподъемность, кг'
  },
  curbWeight: {
    type: DataTypes.INTEGER,
    comment: 'Снаряженная масса (вес прицепа), кг'
  },
  
  // Размеры кузова (внутренние)
  innerLength: { type: DataTypes.INTEGER, comment: 'Длина кузова, мм' },
  innerWidth: { type: DataTypes.INTEGER, comment: 'Ширина кузова, мм' },
  innerHeight: { type: DataTypes.INTEGER, comment: 'Высота бортов/тента, мм' },
  
  // Габаритные размеры (внешние)
  outerLength: { type: DataTypes.INTEGER, comment: 'Габаритная длина, мм' },
  outerWidth: { type: DataTypes.INTEGER, comment: 'Габаритная ширина, мм' },
  outerHeight: { type: DataTypes.INTEGER, comment: 'Габаритная высота, мм' },
  
  // --- Технические характеристики (Technical Specs) ---
  axles: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  suspension: {
    type: DataTypes.STRING, // 'res' (рессорная), 'tor' (торсионная)
    defaultValue: 'res'
  },
  brakes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tipping: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Функция самосвала'
  },
  
  // --- Дополнительно ---
  features: {
    type: DataTypes.JSON, // Массив строк
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Для конфигуратора
  compatibility: {
    type: DataTypes.JSON, // ['atv', 'snowmobile']
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Trailer;
