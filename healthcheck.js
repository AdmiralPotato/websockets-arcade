require('dotenv').config()
const port = process.env.PORT || 3000
fetch(`http://localhost:${port}/`)
  .then(async (response) => ({
    response,
    text: await response.text()
  }))
  .then(({ response, text }) => {
    if (response.status === 200 && text.includes('ARCADE')) {
      console.log('Process is healthy')
      process.exit(0)
    }
    console.log('Process is sick')
    process.exit(1)
  })
