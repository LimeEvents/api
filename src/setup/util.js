const { graphql, print } = require('graphql')

exports.request = schema => async function request (query, variables) {
  console.log(print(query))
  return graphql(schema, print(query), {}, { viewer: { roles: ['administrator'] } }, variables)
}
