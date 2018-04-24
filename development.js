const AssertionError = require('assert').AssertionError
const memo = require('lodash.memoize')
const { microGraphiql, microGraphql } = require('apollo-server-micro')
const { onError } = require('apollo-link-error')
const { router, get, post } = require('microrouter')

const { combineLinks, loadLinks, schemaFromLink } = require('./src')

require('dotenv').load()

const ADMIN_VIEWER = {
  roles: ['administrator'],
  tenantId: 'vslr'
}

const loadSchema = memo(async function () {
  const list = await loadLinks()
  const enhancedList = await Promise.all(
    list.map(async item => {
      item.link = enhanceStacktrace(item.link)
      item.schema = await schemaFromLink(item.link)
      return item
    })
  )
  return combineLinks(enhancedList)
})

function enhanceStacktrace (link) {
  const errorLink = onError(({ response, graphQLErrors }) => {
    if (graphQLErrors) {
      const errors = [].concat(...graphQLErrors.map(formatError))
      errors.forEach((error) => console.error(error.stack.join('\n    ')))
      response.errors = graphQLErrors
        .map(({ originalError }) => originalError)
        .filter((error) => error instanceof AssertionError)
    }
  })
  return errorLink.concat(link)
}

function formatError (error = {}) {
  if (error.originalError) return formatError(error.originalError)
  if (error.errors) error.errors.map(formatError)

  const { locations, message, stack, trace, origin } = error
  let stackArray

  if (stack) stackArray = stack.replace(/\n\s+/g, '\n').split('\n')

  const errorObject = {
    locations,
    message,
    origin
  }

  errorObject.stack = stackArray

  if (Array.isArray(trace)) {
    errorObject.trace = trace.map(formatError)
  }

  return errorObject
}

module.exports = router(
  get('/', microGraphiql({ endpointURL: '/' })),
  post('/', microGraphql(async (req) => {
    const { schema, services } = await loadSchema()
    return {
      schema,
      context: {
        viewer: ADMIN_VIEWER,
        services
      },
      debug: false
    }
  }))
)
