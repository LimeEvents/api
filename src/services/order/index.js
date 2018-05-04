const { SchemaLink } = require('apollo-link-schema')
const { schema } = require('./schema')
const { repository } = require('./interface/repository')
const { application } = require('./interface/application')
const memo = require('lodash.memoize')
const extensions = require('./extensions')

exports.extensions = extensions
exports.link = memo(async function () {
  return new SchemaLink({
    schema: await schema(),
    context (operation) {
      const context = operation.getContext().graphqlContext || {}
      const {
        viewer = { tenantId: 'default', roles: ['administrator'] },
        services = {}
      } = context
      const repo = repository(viewer.tenantId)
      return { viewer, application: application(repo, services) }
    }
  })
})
