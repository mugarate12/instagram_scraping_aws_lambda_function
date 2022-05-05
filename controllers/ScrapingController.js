const dotenv = require('dotenv');
const path = require('path');

const Scraping = require('./../database/models/Scraping.js');
const browserOptions = require('./../utils/BrowserOptions.js');
const scrapingService = require('./../services/ScrapingService.js');

dotenv.config()

const url = String(process.env.INSTAGRAM_TO_SCRAP)
const totalOfGrids = 3

module.exports = {
  routine: async () => {
    const browser = await browserOptions.openBrowser()

    await scrapingService.loginInInstagram(browser)

    await scrapingService.deleteDataOfAwsS3()

    const result = await scrapingService.getPostsImagesSourcesAndReferences(browser, url, totalOfGrids)
    const posts = await scrapingService.getPostsContent(browser, result)

    await scrapingService.updateData(posts)

    await browser.close()

    return posts
  },

  getAll: async () => {
    const docs = await Scraping.findAll({
      attributes: [ 'id', 'content', 'ref', 'source' ]
    })
    
    return docs
  }
}