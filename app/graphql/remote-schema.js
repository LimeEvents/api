const { HttpLink } = require('apollo-link-http')
const fetch = require('node-fetch')
const { introspectSchema, makeRemoteExecutableSchema } = require('graphql-tools')

module.exports = async (url) => {
  const link = new HttpLink({ uri: url, fetch })
  const schema = await introspectSchema(link)
  return makeRemoteExecutableSchema({
    schema,
    link
  })
}
