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
  resolvers: (mergeInfo) => ({
    Location: {
      orders: {
        fragment: 'fragment LocationOrdersFragment on Location { id }',
        resolve ({ id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'orders',
            { filter: { locationId: id }, ...args },
            context,
            info
          )
        }
      },
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
