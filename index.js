require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http')
const server = http.Server(app)
const io = require('socket.io')(server)
const game = require('./game.js')
const port = process.env.PORT || 3000

app.use('/', express.static('public'))

app.get('/data', function (request, response) {
  response.json({
    isOkay: true,
    cats: false
  })
})

game.connectWebSockets(io)

server.listen(port)
console.log(`Starting up server at: http://localhost:${port}/`)
