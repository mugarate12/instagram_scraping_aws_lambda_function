const chromium = require('chrome-aws-lambda')
const { addExtra } = require('puppeteer-extra')

const puppeteerExtra = addExtra(chromium.puppeteer)

module.exports = {
  openBrowser: async () => {
    const browser = await puppeteerExtra
      .launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless
      })

    return browser
  },

  newPage: async (browser) => {
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36')
    await page.setDefaultNavigationTimeout(0)
    await page.setDefaultTimeout(0)

    return page
  }
}