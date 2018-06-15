const { sink } = require('./application')
const { execute } = require('./graphql')

exports.graphql = async (event, context, callback) => {
  const results = await execute(event.query, event.variables, event.context.token)
  callback(null, results)
}

exports.sink = async ({ Records }, context, callback) => {
  const results = await Promise.all(Records.map(({ Sns }) => sink(JSON.parse(Sns.Message))))
  callback(null, results)
}
