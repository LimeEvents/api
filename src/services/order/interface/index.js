const { SchemaLink } = require('@vivintsolar/graphql-stitch-utils')
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
  resolvers: (mergeInfo) => ({
    Order: {
      event: {
        fragment: 'fragment OrderEventFragment on Order { eventId }',
        resolve ({ eventId }, args, context, info) {
          return mergeInfo.delegate(
            'query',
            'event',
            { id: eventId },
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
