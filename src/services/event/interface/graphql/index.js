const { SchemaLink } = require('apollo-link-schema')
const memo = require('lodash.memoize')

const { schema } = require('./schema')
const extensions = require('./extensions')

exports.extensions = extensions

exports.link = memo(async function (application) {
  return new SchemaLink({
    schema: await schema(),
    context (operation) {
      const context = operation.getContext().graphqlContext || {}
      const { viewer = null } = context
      return { viewer, application: application(viewer && viewer.tenantId) }
    }
  })
})
