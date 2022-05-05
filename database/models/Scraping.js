const {
  DataTypes,
  Model,
} = require('sequelize');

const connection = require('./../../config/sequelize.js');

class Scraping extends Model {}
Scraping.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ref: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  source: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  sequelize: connection,
  paranoid: true,
  modelName: 'scraping'
})

module.exports = Scraping
