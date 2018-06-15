const { graphql } = require('graphql')
const curry = require('lodash.curry')
const { application, getViewer } = require('../application')

exports.execute = curry(async (schema, query, variables, token) => {
  const viewer = await getViewer(token)
  return graphql(schema, query, {}, { application: application(viewer) }, variables)
})
