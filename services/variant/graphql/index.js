const { makeExecutableSchema } = require('graphql-tools')

const { definition: typeDefs } = require('./definition')
const { resolvers } = require('./resolvers')
const { execute } = require('./execute')

const schema = makeExecutableSchema({ typeDefs, resolvers })
exports.execute = execute(schema)
exports.schema = schema
