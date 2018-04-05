const { router, get, post } = require('microrouter')
const { microGraphql, microGraphiql } = require('apollo-server-micro')
const { ApolloEngine } = require('apollo-engine')
const micro = require('micro')

const schema = require('./src/schema')

module.exports = router(
  get('/*', microGraphiql({ schema, endpointURL: '/graphql' })),
  post('/graphql', microGraphql((req) => ({
    schema,
    context: { viewer: { roles: ['admin'] } },
    tracing: true,
    cacheControl: true
  })))
)

const httpServer = micro(module.exports)

const engine = new ApolloEngine({
  apiKey: process.env.APOLLO_ENGINE_KEY,
  origins: [{
    supportsBatch: true
  }]
})

engine.listen({
  port: process.env.PORT,
  httpServer
})
