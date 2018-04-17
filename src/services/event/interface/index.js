const { SchemaLink } = require('lime-utils')
const { schema } = require('./schema')
const { repository } = require('./repository')
const { application } = require('./application')
const memo = require('lodash.memoize')

exports.extensions = {
  schema: `
    extend type Event {
      inventory: Inventory!
      location: Location!
      performers(first: Int, last: Int, before: String, after: String): PerformerConnection!
      orders(first: Int, last: Int, before: String, after: String): OrderConnection!
    }
  `,
  resolvers: (mergeInfo) => ({
    Event: {
      orders: {
        fragment: 'fragment EventOrdersFragment on Event { id }',
        resolve ({ id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'orders',
            { filter: { eventId: id }, ...args },
            context,
            info
          )
        }
      },
      inventory: {
        fragment: 'fragment EventInventoryFragment on Event { id }',
        resolve ({ id }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'inventory',
            { eventId: id },
            context,
            info
          )
        }
      },
      location: {
        fragment: 'fragment EventLocationFragment on Event { locationId }',
        resolve ({ locationId }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'location',
            { id: locationId },
            context,
            info
          )
        }
      },
      performers: {
        fragment: 'fragment EventPerformersFragment on Event { performerIds }',
        resolve ({ performerIds }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'performers',
            { filter: { in: performerIds }, ...args },
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
