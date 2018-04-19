const { loadSchema } = require('./schema')

const { microGraphql, microGraphiql } = require('apollo-server-micro')

const ADMIN_VIEWER = {
  roles: ['administrator'],
  tenantId: 'vslr'
}

let handler = microGraphql(async (req) => {
  const { schema, services } = await loadSchema()
  return {
    schema,
    context: {
      viewer: ADMIN_VIEWER,
      services
    },
    debug: false
  }
})

if (process.env.NODE_ENV !== 'production') {
  const { router, get, post } = require('microrouter')
  handler = router(
    get('/', microGraphiql({ endpointURL: '/' })),
    post('/', handler)
  )
}

module.exports = handler
