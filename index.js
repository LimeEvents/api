const { microGraphql } = require('apollo-server-micro')
const { mergeSchemas } = require('graphql-tools')
const { graphql: event } = require('./app/event')
const { schema: location } = require('./app/location')

const schema = mergeSchemas({
  schemas: [ event.schema, location ]
})

module.exports = microGraphql({ schema })
