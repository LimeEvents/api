const fs = require('fs')
const path = require('path')
const { makeExecutableSchema } = require('graphql-tools')
const { promisify } = require('util')
const memo = require('lodash.memoize')

const { resolvers } = require('./resolvers')

const readFile = promisify(fs.readFile)

exports.schema = memo(async function () {
  const sdl = await readFile(path.resolve(__dirname, `Customer.graphql`), 'utf8')

  const schema = makeExecutableSchema({
    typeDefs: [ sdl ],
    resolvers
  })
  console.log('schema', schema)
  return schema
})
