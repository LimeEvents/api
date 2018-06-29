const { makeExecutableSchema } = require('graphql-tools')
const memoize = require('lodash.memoize')
const { resolvers } = require('./resolvers')
const { definition } = require('./definition')

exports.resolvers = resolvers
exports.definition = definition
exports.schema = memoize(() => makeExecutableSchema({ typeDefs: [ definition ], resolvers }))
