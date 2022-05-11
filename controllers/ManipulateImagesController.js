const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');

const Scraping = require('./../database/models/Scraping.js');
const ManipulateImagesService = require('./../services/ManipulateImagesService.js');

dotenv.config()

module.exports = {
  cropImages: async () => {
    const NON_CROPPED_DIR = './NONCROPED'
    const CROPPED_DIR = './CROPPED';

    const docs = await Scraping.findAll();
    fs.mkdirSync(NON_CROPPED_DIR, { recursive: true });	// create directory
    fs.mkdirSync(CROPPED_DIR, { recursive: true });	// create directory

    await ManipulateImagesService.cropImages(docs, NON_CROPPED_DIR, CROPPED_DIR);

    // for (let index = 0; index < docs.length; index++) {
    //   const FILENAME = `${NON_CROPPED_DIR}/test${index}.png`;
    //   const OUTPUT = `${CROPPED_DIR}/test${index}.png`;

    //   const doc = docs[index];
    //   const docContent =  doc.get();
    //   const source = docContent.source;
      
    //   const { data } = await axios.default.get(source, { responseType: 'arraybuffer' });
    //   const buffer = Buffer.from(data);

    //   fs.writeFileSync(FILENAME, buffer);

    //   // initial pixel in x axis
    //   const left = 638
    //   // initial pixel in y axis
    //   // 205
    //   const top = 220
    //   const width = 645
    //   const height = 645

    //   await sharp(FILENAME)
    //     .extract({ left, top, width, height })
    //     .toFile(OUTPUT)
    //     .then(info => {
    //       console.log('image cropped');
    //     })
    //     .catch(err => {
    //       console.log(err);
    //     });
    // }
  }
}