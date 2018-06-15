const { sink } = require('./application')
const { execute } = require('./graphql')

exports.graphql = async ({ query, variables, context: { token } = {} }, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  const results = await execute(query, variables, token)
  callback(null, results)
}

exports.sink = async ({ Records }, context, callback) => {
  const results = await Promise.all(Records.map(({ Sns }) => sink(JSON.parse(Sns.Message))))
  callback(null, results)
}
