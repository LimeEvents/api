require('dotenv').load()
const micro = require('micro')
const graphql = require('./index')
const dynalite = require('dynalite')

const PORT = process.env.PORT || 3000
const dynaliteServer = dynalite({ path: './tmp', createTableMs: 50 })

dynaliteServer.listen(4567, async (err) => {
  if (err) throw err
  console.info('Dynalite started on port 4567')
  const server = micro(graphql)
  server.listen(PORT)
  console.info(`Server listening on port "${PORT}"`)
})
