const { microGraphql, microGraphiql } = require('apollo-server-micro')
const { router, get, post } = require('microrouter')
const cors = require('micro-cors')()

const { loadSchema } = require('./src')

const ADMIN_VIEWER = {
  roles: ['administrator'],
  tenantId: 'vslr'
}

let handler = router(
  get('/', microGraphiql({ endpointURL: '/' })),
  post('/', microGraphql(async (req) => {
    const { schema, services } = await loadSchema()
    return {
      schema,
      context: {
        viewer: ADMIN_VIEWER,
        services
      },
      debug: false
    }
  }))
)

module.exports = cors(handler)
