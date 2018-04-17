const { SchemaLink } = require('lime-utils')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: `
    extend type Location {
      events(first: Int, last: Int, before: String, after: String): EventConnection!
    }
  `,
  resolvers: (mergeInfo) => ({
    Location: {
      events: {
        fragment: 'fragment LocationEventsFragment on Location { id }',
        resolve ({ id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'events',
            { filter: { locationId: id }, ...args },
            context,
            info
          )
        }
      }
    }
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
