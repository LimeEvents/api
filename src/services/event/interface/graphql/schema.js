const { makeExecutableSchema } = require('graphql-tools')
const memo = require('lodash.memoize')

const { definition } = require('./definition')
const { resolvers } = require('./resolvers')

exports.schema = memo(async function () {
  return makeExecutableSchema({ typeDefs: [ definition ], resolvers })
})
