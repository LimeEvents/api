const { graphql } = require('graphql')
const { json, send } = require('micro')
const { router, get, post, options } = require('microrouter')
const { microGraphiql } = require('apollo-server-micro')

const schema = require('./schema')
const http = async (req, res) => {
  res.setHeader('Access-Control-Max-Age', 60 * 60 * 24)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', [ 'POST', 'OPTIONS' ])
  res.setHeader('Access-Control-Allow-Headers', [ 'X-Apollo-Tracing', 'credentials', 'X-Requested-With', 'Access-Control-Allow-Origin', 'X-HTTP-Method-Override', 'Content-Type', 'Authorization', 'Accept' ])
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    console.log('return early for options')
    return send(res, 204)
  }
  const { query, variables } = await json(req)
  console.log('return real thing', query, variables)
  return graphql(schema, query, {}, { viewer: { roles: ['admin'] } }, variables)
}

module.exports = router(
  get('/', microGraphiql({ schema, endpointURL: '/' })),
  options('/', http),
  post('/', http)
)
