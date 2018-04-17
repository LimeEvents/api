const { mergeSchemas, introspectSchema, makeRemoteExecutableSchema } = require('graphql-tools')
const { Binding } = require('lime-utils')
const performer = require('./services/performer')
const location = require('./services/location')

const { microGraphql, microGraphiql } = require('apollo-server-micro')

const ADMIN_VIEWER = {
  roles: ['administrator'],
  tenantId: 'vslr'
}

const schemaPromise = (async function (services) {
  const list = await Promise.all(
    Object.entries(services)
      .map(async ([ key, { link, extensions } ]) => {
        const _link = await link()
        const schema = await schemaFromLink(_link)
        return {
          key,
          schema,
          extensions,
          binding: new Binding({ link: _link })
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
}({ location, performer }))

async function schemaFromLink (link) {
  return makeRemoteExecutableSchema({
    schema: await introspectSchema(link),
    link
  })
}

let handler = microGraphql(async (req) => {
  const { schema, services } = await schemaPromise
  return {
    schema,
    context: {
      viewer: ADMIN_VIEWER,
      services
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  const { router, get, post } = require('microrouter')
  handler = router(
    get('/', microGraphiql({ endpointURL: '/' })),
    post('/', handler)
  )
}

module.exports = handler
