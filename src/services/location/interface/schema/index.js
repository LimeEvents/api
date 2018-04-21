const fs = require('fs')
const memo = require('lodash.memoize')
const path = require('path')
const { makeExecutableSchema } = require('graphql-tools')
const { promisify } = require('util')

const { resolvers } = require('./resolvers')

const readFile = promisify(fs.readFile)

exports.schema = memo(async function schema () {
  const sdl = await readFile(path.resolve(__dirname, 'schema.graphql'), 'utf8')
  return makeExecutableSchema({
    typeDefs: [ sdl ],
    resolvers
  })
})
