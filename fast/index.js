require('dotenv').load()
const { router, get, post } = require('microrouter')
const { microGraphql, microGraphiql } = require('apollo-server-micro')
const { makeExecutableSchema } = require('graphql-tools')
const merge = require('lodash.merge')

const event = require('./event')
const product = require('./product')
const variant = require('./variant')
const channel = require('./channel')

const services = [channel, event, variant, product]

const resolvers = merge({}, ...services.map(({ resolvers }) => resolvers))
const typeDefs = services.map(({ definition }) => definition)

typeDefs.push(`
  scalar Url
  scalar Currency
  scalar DateTime
  scalar JSON

  enum MediumType {
    Image
    Video
  }

  enum ContentOutputFormat {
    HTML
    Markdown
    Text
  }
`)

const schema = makeExecutableSchema({ typeDefs, resolvers })

module.exports = router(
  get('/', microGraphiql({ endpointURL: '/graphql' })),
  post('/graphql', microGraphql(async (req) => {
    const viewer = await getViewer(req.headers.authorization)
    return {
      schema,
      context: { viewer }
    }
  }))
)

async function getViewer (token) {
  return { roles: ['administrator'] }
}
