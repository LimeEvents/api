const { graphqlLambda } = require('apollo-server-lambda')
const { sink } = require('./application')
const { schema } = require('./graphql')

exports.graphql = graphqlLambda({ schema })

exports.sink = async ({ Records }, context, callback) => {
  const results = await Promise.all(Records.map(({ Sns }) => sink(JSON.parse(Sns.Message))))
  callback(null, results)
}
