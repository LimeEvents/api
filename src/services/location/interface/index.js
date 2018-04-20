const AssertionError = require('assert').AssertionError
const { onError } = require('apollo-link-error')
const { SchemaLink } = require('@vivintsolar/graphql-stitch-utils')
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
  const errorLink = onError((things) => {
    const { response, graphQLErrors } = things
    if (graphQLErrors) {
      const errors = [].concat(...graphQLErrors.map(formatError))
      errors.forEach((error) => console.error(error.stack.join('\n    ')))
      response.errors = graphQLErrors
        .map(({ originalError }) => originalError)
        .filter((error) => error instanceof AssertionError)
    }
  })
  const _schema = await schema()
  const schemaLink = new SchemaLink({
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
  return errorLink.concat(schemaLink)
})

function formatError (error = {}) {
  if (error.originalError) {
    return formatError(error.originalError)
  }

  if (error.errors) {
    return error.errors.map(formatError)
  }

  const { locations, message, stack, trace, origin } = error
  let stackArray

  if (stack) {
    stackArray = stack.replace(/\n\s+/g, '\n').split('\n')
  }

  const errorObject = {
    locations,
    message,
    origin
  }

  if (process.env.NODE_ENV !== 'production') {
    errorObject.stack = stackArray
  }

  if (Array.isArray(trace)) {
    errorObject.trace = trace.map(formatError)
  }

  return errorObject
}
