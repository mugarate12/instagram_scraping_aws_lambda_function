const AWS = require("aws-sdk");
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Op } = require('sequelize');

const Scraping = require('./../database/models/Scraping.js');

dotenv.config();

AWS.config.update({ region: process.env.REGION });
const S3 = new AWS.S3({apiVersion: '2006-03-01'});

async function cropImage(imageContent) {
  // initial pixel in x axis
  const left = 638;
  // initial pixel in y axis
  // 205
  const top = 220;
  const width = 645;
  const height = 645;

  return await sharp(imageContent)
    .extract({ left, top, width, height })
    .toFormat('jpeg', { quality: 100, progressive: true })
    .toBuffer()
}

/**
 * @param {Array<Record>} records 
 * @param {String} nonCroppedDirName 
 * @param {String} croppedDirName 
 */
async function cropImages(records) {
  console.log('chegou aqui');
  console.log('records', records);

  const promises = records.map(async (record, index) => {
    const { key } = record.s3.object;
    console.log('key', key);
    const getPayload = { Bucket: process.env.bucket, Key: key };
    console.log('get payload', getPayload);
    const image = await S3.getObject(getPayload).promise();
    const imageContent = image.Body;

    console.log('Cropping image:', key);

    const croppedImageBuffer = await cropImage(imageContent);
    const nameWithoutExtension = path.basename(key, path.extname(key));
    const newKey = `${nameWithoutExtension}.jpg`;
    
    console.log('image cropped:', newKey);

    const result = await S3.upload({
      Bucket: process.env.bucket,
      Key: newKey,
      Body: croppedImageBuffer,
      ContentType: 'image/jpeg',
    }).promise();
    const imageRef = String(result.Location);

    await Scraping.update({
      source: imageRef
    }, {
      where: {
        ref: {
          [Op.like]: `%${nameWithoutExtension}%`
        }
      }
    })
  })

  await Promise.all(promises);
}

module.exports = {
  cropImages
}