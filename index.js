require('dotenv').config()
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.Server(app)
const io = require('socket.io')(server)
const manager = require('./game-manager.js')
const port = process.env.PORT || 3000
const clientDependencyMap = {
  '/vue': 'node_modules/vue/dist',
  '/nipplejs': 'node_modules/nipplejs/dist',
  '/gl-matrix': 'node_modules/gl-matrix/dist'
}

// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})

// setup the logger
app.use(morgan(
  'combined',
  {stream: accessLogStream}
))

app.use('/', express.static('public'))
Object.keys(clientDependencyMap).forEach((key) => {
  app.use(key, express.static(path.join(__dirname, clientDependencyMap[key])))
})

app.get('/data', function (request, response) {
  response.json({
    isOkay: true,
    cats: false
  })
})

manager.connectWebSockets(io)

server.listen(port)
console.log(`Starting up server at: http://localhost:${port}/`)
