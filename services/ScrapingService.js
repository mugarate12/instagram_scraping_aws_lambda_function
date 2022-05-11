const AWS = require("aws-sdk")
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const browserOptions = require('./../utils/BrowserOptions.js')
const Scraping = require('./../database/models/Scraping.js')

dotenv.config()

AWS.config.update({ region: process.env.REGION })
const S3 = new AWS.S3({apiVersion: '2006-03-01'})

async function sleep (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

/**
 * @description return all references to actual data in database of files in aws s3
 */
async function getReferencesOfActualDataInDatabase() {
  const docs = await Scraping.findAll()
    .catch(error => {
      console.log(`erro no banco de dados: ${error}`);
    })

  if (!!docs) {
    return docs.map(doc => path.basename(doc.source))
  } else {
    return []
  }
}

/**
 * @description receive files reference to delete in aws s3
 */
async function deleteDataOfAwsS3() {
  console.log('deletando arquivos do s3 e do banco de dados');
  const references = await getReferencesOfActualDataInDatabase()

  if (references.length > 0) {
    const objects = references.map(reference => {
      return { Key: reference }
    })

    const params = {
      Bucket: process.env.BUCKET,
      Delete: {
        Objects: objects
      }
    }

    await S3.deleteObjects(params).promise()
  }
}

async function goToPage(browser, url) {
  const page = await browserOptions.newPage(browser);

  let tryGoToPage = 0
  let sucess = false

  while (tryGoToPage < 3 && !sucess) {
    await page.goto(url, { waitUntil: ['networkidle0', 'load'] })
      .then(response => {
        console.log(`status: ${response.status()}, url: ${url}`);

        if (response.status() === 200) {
          sucess = true
        }
      })
      .catch(error => {
        console.log('go to page error: ', error)
      })

    tryGoToPage++
  }

  return page
}

/**
 * @description get and save all images to directory constants.directiries.postsImages
 * @param browser instance of browser to open page of image
 * @param postRef reference of post to create id of image
 * @param postImageSrc source or link of image
 */
async function getPostImage(browser, postRef, postImageSrc) {
  const page = await browserOptions.newPage(browser)
  
  await page.goto(postImageSrc, { waitUntil: ['networkidle0', 'load'] })
  const reference = path.basename(postRef)
  const ext = '.png'

  const buffer = await page.screenshot({ fullPage: true })

  const payload = {
    Bucket: process.env.BUCKET,
    Key: `${reference}${ext}`,
    Body: buffer,
    ContentType: 'image/png',
    region: process.env.REGION
    // ACL: 'public-read'
  }

  // promise aws s3 insert
  // await S3.putObject(payload).promise()
  const result = await S3.upload(payload).promise()
  const imageRef = String(result.Location)

  await page.close()

  // return result.Location of s3 insert
  // const result = ''
  return imageRef
}

/**
* @description log in instagram base in .env variables INSTAGRAM_USER and INSTAGRAM_PASSWORD
*/
async function loginInInstagram (browser) {
  console.log('login in instagram')

  const url = 'https://www.instagram.com'
  const page = await goToPage(browser, url)

  await page.type("input[name='username']", String(process.env.INSTAGRAM_USER), {  delay: 50 })
  await page.type("input[name='password']", String(process.env.INSTAGRAM_PASSWORD), {  delay: 50 })

  await page.click('#loginForm > div > div:nth-child(3) > button > div')

  await this.sleep(10)

  await page.close()
}

/**
*  @summary return a total of posts based of totalOfGrids property, but, if instagram not have this total of posts, get more of possible
*  @param browser browser instance to make all requests
*  @returns content of posts
*/
async function getPostsImagesSourcesAndReferences (browser, url, totalOfGrids) {
  console.log(`first step: get posts images sources and references \n page: ${url}`)
  const page = await goToPage(browser, url)

  const result = await page.evaluate((totalOfGrids) => {
    let result = [
      {
        imageSource: '',
        postRef: ''
      }
    ]

    // get image source and post href for each post in grid of three elements
    function getElements(grid, result) {
      Object.keys(grid.children).forEach((_, index) => {
        const post = grid.children[index]

        let href = String(post.children[0]['href'])
        let src = String(post.children[0].children[0].children[0].children[0]['src'])

        result.push({
          imageSource: src,
          postRef: href
        })
      })
    }
    
    let content = document.getElementsByClassName('ySN3v')[0]
    let contentDiv = content.children[0]
    let subContentDiv = contentDiv.children[0]
    let gridOfContent = subContentDiv.children

    for (let index = 0; index < Object.keys(gridOfContent).length; index++) {
      const grid = gridOfContent[index]
      
      if ((index + 1) > totalOfGrids) {
        break
      } 

      getElements(grid, result)
    }

    return result.slice(1, result.length)
  }, totalOfGrids)

  await page.close()

  return result
}

/**
 * @param browser browser instance to make all requests
 * @returns content of posts with text content of post and create image of each post in postsImages directory
 */
async function getPostsContent (browser, postsSources) {
  let result = []

  //  get content of page
  for (let index = 0; index < postsSources.length; index++) {
    const postSource = postsSources[index]
    
    let content = ''
    let success = false
    let tryAgainGetContent = 0

    while (tryAgainGetContent <= 5 && !success && !content) {
      const postPage = await goToPage(browser, postSource.postRef)
      
      await postPage.evaluate(() => {
        let result = ''

        let spanWithText = document.getElementsByClassName('_7UhW9   xLCgt      MMzan   KV-D4           se6yk       T0kll ')[0]

        if (!!spanWithText) {
          result = String(spanWithText.textContent)
        }

        return result
      })
        .then(async (response) => {
          content = response
          success = true
          
          await postPage.close()
        })
        .catch(() => {
          tryAgainGetContent += 1
        })
    }
      
    result[index] = {
      ...postSource,
      content
    }
    // result.push({
    //   ...postSource,
    //   content
    // })
  }

  console.log('ready for create images in Amazon S3')

  for (let index = 0; index < result.length; index++) {
    const post = result[index]
    
    // implement this
    const postImageReference = await getPostImage(browser, post.postRef, post.imageSource)

    result[index] = {
      ...post,
      imageSource: postImageReference
    }
  }

  return result
}

/**
 * @description use this to update data of posts in database
 * @param postsContent content of posts with text content of post and create image of each post in postsImages directory
 */
async function updateData (postsContent) {
  // create all 
  if (postsContent.length > 0) {
    // delete all data
    await Scraping.destroy({
      truncate: true,
      force: true
    })

    const requests = postsContent.map(async (post) => {
      await Scraping.create({
        content: post.content,
        ref: post.postRef,
        source: post.imageSource
      })
    })

    await Promise.all(requests)
  }
}

module.exports = {
  sleep,
  goToPage,
  
  getPostImage,
  loginInInstagram,
  getPostsImagesSourcesAndReferences,
  getPostsContent,

  deleteDataOfAwsS3,
  updateData
}
