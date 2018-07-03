const { makeExecutableSchema } = require('graphql-tools')

const { definition } = require('./definition')
const { resolvers } = require('./resolvers')

exports.schema = makeExecutableSchema({ typeDefs: [ definition ], resolvers })
