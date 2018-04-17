const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const { makeExecutableSchema } = require('graphql-tools')

const { resolvers } = require('./resolvers')

const readFile = promisify(fs.readFile)

const memo = require('lodash.memoize')

exports.schema = memo(async function schema () {
  console.log('calling get schema')
  const sdl = await readFile(path.resolve(__dirname, 'schema.graphql'), 'utf8')

  return makeExecutableSchema({
    typeDefs: [ sdl ],
    resolvers
  })
})
