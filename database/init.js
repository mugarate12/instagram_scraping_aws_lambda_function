const dotenv = require('dotenv');

const sequelize = require('./../config/sequelize.js');
const Scraping = require('./models/Scraping.js');

dotenv.config()

const init = async () => {
  await sequelize.sync({ force: false });
}

module.exports = init