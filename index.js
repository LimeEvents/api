const { router, get, post } = require('microrouter')
const { microGraphql, microGraphiql } = require('apollo-server-micro')

const schema = require('./schema')

module.exports = router(
  get('/*', microGraphiql({ schema, endpointURL: '/graphql' })),
  post('/graphql', microGraphql({ schema, context: { viewer: { roles: ['admin'] } } }))
)
