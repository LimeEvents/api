const { SchemaLink } = require('apollo-link-schema')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: `
    extend type Location {
      events(first: Int, last: Int, before: String, after: String): EventConnection!
      orders(first: Int, last: Int, before: String, after: String): OrderConnection!
    }
  `,
  resolvers: ({ order, event }) => ({
    Location: {
      orders: {
        fragment: 'fragment LocationOrdersFragment on Location { id }',
        resolve ({ id }, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: order,
            operation: 'query',
            fieldName: 'orders',
            args: { filter: { locationId: id }, ...args },
            context,
            info
          })
        }
      },
      events: {
        fragment: 'fragment LocationEventsFragment on Location { id }',
        resolve ({ id }, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: event,
            operation: 'query',
            fieldName: 'events',
            args: { filter: { locationId: id }, ...args },
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
