'use strict'
const initDatabase = require('./database/init.js');
const browserOptions = require('./utils/BrowserOptions.js');
const Scraping = require('./database/models/Scraping.js');
const ScrapingController = require('./controllers/ScrapingController.js');
const ManipulateImagesController = require('./controllers/ManipulateImagesController.js');

process.setMaxListeners(0) // Important line - Fix MaxListerners Error

module.exports.scraping = async (event) => {
  await initDatabase();
  
  await ScrapingController.routine();
  
  const data = await Scraping.findAll()

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
        content: data
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

module.exports.get = async (event) => {
  try {
    const data = await ScrapingController.getAll()
  
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Dados recuperados com sucesso!',
          // input: event,
          posts: data
        },
        null,
        2
      ),
    };
  } catch (error) {
    return {
      statusCode: 403,
      body: JSON.stringify(
        {
          message: 'Erro ao recuperar dados: ' + error,
          input: event,
        },
        null,
        2
      ),
    }
  }
}

module.exports.cropImages = async (event) => {
  try {
    await initDatabase();

    await ManipulateImagesController.cropImages();

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Dados recuperados com sucesso!',
          // input: event,
        },
        null,
        2
      ),
    };
  } catch (error) {
    return {
      statusCode: 403,
      body: JSON.stringify(
        {
          message: 'Erro ao recuperar dados: ' + error,
          input: event,
        },
        null,
        2
      ),
    }
  }
}
