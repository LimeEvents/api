const memo = require('lodash.memoize')
const { makeExecutableSchema } = require('graphql-tools')

const { resolvers } = require('./resolvers')
const { definition } = require('./definition')

exports.schema = memo(async () => makeExecutableSchema({ typeDefs: [ definition ], resolvers }))
