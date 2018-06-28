const { mergeSchemas, makeRemoteExecutableSchema } = require('graphql-tools')
const { buildClientSchema } = require('graphql')
const product = require('./services/product.json')
const { links } = require('./links')

const introspections = {
  product
}
exports.links = links
exports.schema = mergeSchemas({
  schemas: [
    makeRemoteExecutableSchema({
      link: links.product,
      schema: buildClientSchema(introspections.product.data)
    })
  ]
})
