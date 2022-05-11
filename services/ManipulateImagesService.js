const AWS = require("aws-sdk");
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const Scraping = require('./../database/models/Scraping.js');

dotenv.config();

AWS.config.update({ region: process.env.REGION });
const S3 = new AWS.S3({apiVersion: '2006-03-01'});

async function cropImage(filename, output) {
  // initial pixel in x axis
  const left = 638;
  // initial pixel in y axis
  // 205
  const top = 220;
  const width = 645;
  const height = 645;

  await sharp(filename)
    .extract({ left, top, width, height })
    .toFile(output)
    .then(info => {
      console.log(`image cropped`);
    })
    .catch(err => {
      console.log(err);
    });
}

async function cropImages(docs, nonCroppedDirName, croppedDirName) {
  const promises = docs.map(async (doc, index) => {
    const FILENAME = `${nonCroppedDirName}/test${index}.png`;
    const OUTPUT = `${croppedDirName}/test${index}.png`;

    const docContent =  doc.get();
    const source = docContent.source;
    const key = path.basename(source);

    const { data } = await axios.default.get(source, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(data);

    fs.writeFileSync(FILENAME, buffer);

    await cropImage(FILENAME, OUTPUT);
  })

  await Promise.all(promises);
}

module.exports = {
  cropImages
}