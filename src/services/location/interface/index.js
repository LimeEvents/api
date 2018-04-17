const { SchemaLink } = require('lime-utils')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: null,
  resolvers: (mergeInfo) => ({
  })
}

exports.link = memo(async function () {
  const _schema = await schema()
  return new SchemaLink({
    schema: _schema,
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
