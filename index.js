require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.Server(app)
const io = require('socket.io')(server)
const game = require('./game.js')
const port = process.env.PORT || 3000
const clientDependencyMap = {
  '/vue': 'node_modules/vue/dist',
  '/nipplejs': 'node_modules/nipplejs/dist'
}

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

game.connectWebSockets(io)

server.listen(port)
console.log(`Starting up server at: http://localhost:${port}/`)
