const dotenv = require('dotenv');
const fs = require('fs');

const ManipulateImagesService = require('./../services/ManipulateImagesService.js');

dotenv.config()

/**
 * @param {Array<Record>} records 
 */
async function cropImages(records) {
  console.log('fui chamado');
  await ManipulateImagesService.cropImages(records);
}

module.exports = {
  cropImages
}