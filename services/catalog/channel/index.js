const { graphqlLambda } = require('apollo-server-lambda')

const { schema } = require('./graphql')

exports.graphql = graphqlLambda({ schema: schema() })
