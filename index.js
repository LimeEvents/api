const { microGraphql } = require('apollo-server-micro')

const { loadSchema } = require('./services')

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

module.exports = handler
