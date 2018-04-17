const { SchemaLink } = require('lime-utils')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: `
    extend type Performer {
      events(first: Int, last: Int, before: String, after: String): EventConnection!
    }
  `,
  resolvers: (mergeInfo) => ({
    Performer: {
      events: {
        fragment: 'fragment PerformerEventsFragment on Performer { id }',
        resolve ({ id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'events',
            { filter: { performerId: id }, ...args },
            context,
            info
          )
        }
      }
    }
  })
}

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
