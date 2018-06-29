const { mergeSchemas, makeRemoteExecutableSchema } = require('graphql-tools')
const { buildClientSchema } = require('graphql')
const catalog = require('./services/catalog.json')
const { links } = require('./links')

const introspections = {
  catalog
}
exports.links = links
exports.schema = mergeSchemas({
  schemas: [
    makeRemoteExecutableSchema({
      link: links.catalog,
      schema: buildClientSchema(introspections.catalog.data)
    })
  ]
})
