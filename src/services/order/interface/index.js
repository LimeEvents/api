const { SchemaLink } = require('apollo-link-schema')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: `
    extend type Order {
      event: Event!
    }
  `,
  resolvers: ({ event }) => ({
    Order: {
      event: {
        fragment: 'fragment OrderEventFragment on Order { eventId }',
        resolve ({ eventId }, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: event,
            operation: 'query',
            fieldName: 'event',
            args: { id: eventId },
            context,
            info
          })
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
