const { microGraphql, microGraphiql } = require('apollo-server-micro')
const { router, get, post } = require('microrouter')
const { schema } = require('./graphql')
const { getViewer } = require('./application')

module.exports = router(
  get('/', microGraphiql({ endpointURL: '/graphql' })),
  post('/graphql', microGraphql(async req => {
    const viewer = await getViewer(req.headers.authorization)
    return { schema: schema(), context: { viewer } }
  }))
)
