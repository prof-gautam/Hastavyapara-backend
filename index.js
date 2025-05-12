require('dotenv').config()
const express = require('express')
const chalk = require('chalk')
const cors = require('cors')
const helmet = require('helmet')

const keys = require('./config/keys')
const routes = require('./routes')
const socket = require('./socket')
const setupDB = require('./utils/db')

const { port } = keys
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

setupDB()
require('./config/passport')(app)
app.use(routes)

module.exports = app

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  )
})

socket(server)
