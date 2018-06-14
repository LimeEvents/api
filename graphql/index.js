const { makeExecutableSchema } = require('graphql-tools')

const { definition } = require('./definition')
const { resolvers } = require('./resolvers')
const { execute } = require('./execute')

const schema = makeExecutableSchema({ typeDefs: [ definition ], resolvers })
exports.execute = execute(schema)
exports.schema = schema
