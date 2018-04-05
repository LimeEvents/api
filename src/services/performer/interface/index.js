const fs = require('fs')
const path = require('path')
const { makeExecutableSchema } = require('graphql-tools')

const application = require('./application')
const resolvers = require('./resolvers')

exports.schema = makeExecutableSchema({
  typeDefs: [ load('Performer') ],
  resolvers
})

exports.application = application

function load (src) {
  return fs.readFileSync(path.resolve(__dirname, `${src}.graphql`), 'utf8')
}
