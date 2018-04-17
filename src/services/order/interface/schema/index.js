const fs = require('fs')
const path = require('path')
const { makeExecutableSchema } = require('graphql-tools')
const { promisify } = require('util')
const memo = require('lodash.memoize')

const resolvers = require('./resolvers')

const readFile = promisify(fs.readFile)

exports.schema = memo(async function () {
  const sdl = await readFile(path.resolve(__dirname, `Order.graphql`), 'utf8')
  return makeExecutableSchema({
    typeDefs: [ sdl ],
    resolvers
  })
})
