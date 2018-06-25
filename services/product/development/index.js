require('dotenv').load()
const { router, get, post } = require('microrouter')
const { schema } = require('../graphql')
const { application, getViewer } = require('../application')
const { microGraphql, microGraphiql } = require('apollo-server-micro')

module.exports = router(
  get('/', microGraphiql({ endpointURL: '/graphql' })),
  post('/graphql', microGraphql(async (req) => {
    const viewer = await getViewer(req.headers.authorization)
    return {
      schema,
      context: {
        application: application(viewer)
      }
    }
  }))
)
