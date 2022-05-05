const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config()

const databaseName = process.env.DATABASE_NAME
const username = process.env.DATABASE_USER
const password = process.env.DATABASE_PASSWORD
const host = process.env.DATABASE_HOST
const port = Number(process.env.DATABASE_PORT)

console.log({
    databaseName,
    username,
    password,
    host,
    port
});

const connection = new Sequelize(databaseName, username, password, {
  host,
  port,
  dialect: 'mysql'
})

module.exports = connection