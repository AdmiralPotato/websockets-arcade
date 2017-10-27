require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use('/', express.static('public'))

app.get('/data', function (request, response) {
  response.json({
    isOkay: true,
    cats: false
  })
})

app.listen(port)
console.log(`Starting up server at: http://localhost:${port}/`)
