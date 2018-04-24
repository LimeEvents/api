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
    .reduce((prev, { key, schema, extensions }) => {
      if (extensions.schema) prev[`${key}_ext`] = extensions.schema
      prev[key] = schema
      return prev
    }, {})

  const resolvers = list.reduce((prev, { extensions }) => {
    if (extensions.resolvers) return { ...prev, ...extensions.resolvers(schemas) }
    return prev
  }, {})

  return {
    services: list.reduce((prev, { key, binding }) => {
      prev[key] = binding
      return prev
    }, {}),
    schema: mergeSchemas({
      schemas: Object.values(schemas),
      resolvers
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
