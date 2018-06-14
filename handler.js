const { execute } = require('./graphql')

exports.graphql = async (event, context, callback) => {
  const results = await execute(event.query, event.variables, event.context.token)
  callback(null, results)
}
