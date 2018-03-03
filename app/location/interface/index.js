const fs = require('fs')
const path = require('path')

const { connectionFromPromisedArray } = require('graphql-relay')
const { makeExecutableSchema } = require('graphql-tools')

const repository = require('./repository')
const application = require('../application')(repository)

exports.schema = makeExecutableSchema({
  typeDefs: [ fs.readFileSync(path.resolve(__dirname, 'Location.graphql'), 'utf8') ],
  resolvers: {
    Query: {
      location (source, { id }) {
        return application.get(id)
      },
      locations (source, args) {
        return connectionFromPromisedArray(application.find(), args)
      }
    }
  }
})
