const fs = require('fs')
const path = require('path')

const { toGlobalId, fromGlobalId, connectionFromPromisedArray } = require('graphql-relay')
const { makeExecutableSchema } = require('graphql-tools')

const repository = require('./repository')
const application = require('../application')(repository)

exports.schema = makeExecutableSchema({
  typeDefs: [ fs.readFileSync(path.resolve(__dirname, 'Location.graphql'), 'utf8') ],
  resolvers: {
    Node: {
      __resolveType (source) {
        return fromGlobalId(source.id).type
      }
    },
    Query: {
      async node (source, args, { viewer }, info) {
        const { id } = fromGlobalId(args.id)
        const location = await application.get(viewer, id)
        return { ...location, id: toGlobalId('Location', id) }
      },
      async location (source, { id }, { viewer }) {
        const location = await application.get(viewer, id)
        return { ...location, id: toGlobalId('Location', id) }
      },
      async locations (source, args, { viewer }) {
        const list = await connectionFromPromisedArray(application.find(viewer), args)
        return list.map((location) => ({ ...location, id: toGlobalId('Location', location.id) }))
      }
    }
  }
})

exports.application = application
