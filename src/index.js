const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/graphql-repository')
const { mergeSchemas, introspectSchema, makeRemoteExecutableSchema } = require('graphql-tools')

const performer = require('./services/performer')
const event = require('./services/event')
const location = require('./services/location')
const order = require('./services/order')
const customer = require('./services/customer')

const SERVICES = { performer, order, location, event, customer }

async function loadLinks (services = SERVICES) {
  const list = await Promise.all(
    Object.entries(services)
      .map(async ([ key, { link, extensions } ]) => {
        const _link = await link()
        const schema = await schemaFromLink(_link)
        return {
          key,
          link: _link,
          schema,
          extensions,
          binding: new Repository({ get: key, find: `${key}s`, link: _link })
        }
      })
  )
  return list
}

async function schemaFromLink (link) {
  return makeRemoteExecutableSchema({
    schema: await introspectSchema(link),
    link
  })
}

function combineLinks (list) {
  const schemas = list
    .reduce((prev, { schema, extensions }) => {
      if (extensions.schema) prev.push(extensions.schema)
      return [schema].concat(prev)
    }, [])

  const resolvers = list.reduce((prev, { extensions }) => {
    if (extensions.resolvers) prev.push(extensions.resolvers)
    return prev
  }, [])

  return {
    services: list.reduce((prev, { key, binding }) => {
      prev[key] = binding
      return prev
    }, {}),
    schema: mergeSchemas({
      schemas,
      resolvers (mergeInfo) {
        return resolvers.reduce((prev, curr) => ({ ...prev, ...curr(mergeInfo) }), {})
      }
    })
  }
}

exports.loadLinks = loadLinks
exports.combineLinks = combineLinks
exports.loadSchema = memo(async function () {
  const list = await loadLinks()
  const combined = await combineLinks(list)
  return combined
})
