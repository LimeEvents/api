const memo = require('lodash.memoize')
const { Binding } = require('@vivintsolar/graphql-stitch-utils')
const { mergeSchemas, introspectSchema, makeRemoteExecutableSchema } = require('graphql-tools')

const performer = require('./services/performer')
const event = require('./services/event')
const location = require('./services/location')
const order = require('./services/order')

const SERVICES = { performer, order, location, event }

exports.loadSchema = memo(async function () {
  const list = await Promise.all(
    Object.entries(SERVICES)
      .map(async ([ key, { link, extensions } ]) => {
        const _link = await link()
        const schema = await schemaFromLink(_link)
        return {
          key,
          schema,
          extensions,
          binding: new Binding({ name: key, link: _link })
        }
      })
  )

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
})

async function schemaFromLink (link) {
  return makeRemoteExecutableSchema({
    schema: await introspectSchema(link),
    link
  })
}
