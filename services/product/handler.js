const { graphql } = require('graphql')
const { application, getViewer, sink } = require('./application')
const { schema } = require('./graphql')

exports.graphql = async ({ query, variables, context: { token } }, context, cb) => {
  try {
    const viewer = await getViewer(token)
    const results = await graphql(schema, query, {}, { application: application(viewer) }, variables)
    return cb(null, results)
  } catch (ex) {
    cb(ex)
  }
}

exports.sink = async ({ Records }, context, callback) => {
  const results = await Promise.all(Records.map(({ Sns }) => sink(JSON.parse(Sns.Message))))
  callback(null, results)
}
