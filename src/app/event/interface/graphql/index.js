const { json, send } = require('micro')
const schema = require('./schema')
const { graphql } = require('graphql')

exports.middleware = async (req, res) => {
  res.setHeader('Access-Control-Max-Age', 60 * 60 * 24)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', [ 'POST', 'OPTIONS' ])
  res.setHeader('Access-Control-Allow-Headers', [ 'X-Apollo-Tracing', 'credentials', 'X-Requested-With', 'Access-Control-Allow-Origin', 'X-HTTP-Method-Override', 'Content-Type', 'Authorization', 'Accept' ])
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return send(res, 204)
  }
  const { query, variables } = await json(req)
  return graphql(schema, query, {}, { viewer: { roles: ['admin'] } }, variables)
}

exports.schema = schema
