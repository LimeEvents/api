const fs = require('fs')
const path = require('path')
const { makeExecutableSchema } = require('graphql-tools')

const resolvers = require('./resolvers')

module.exports = makeExecutableSchema({
  typeDefs: [ load('Performer') ],
  resolvers
})

function load (src) {
  return fs.readFileSync(path.resolve(__dirname, `${src}.graphql`), 'utf8')
}
