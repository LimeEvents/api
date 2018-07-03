const gql = require('graphql-tag')

exports.definition = gql`
  extend type Query {
    health: HealthCheck!
  }

  type HealthCheck {
    dynamo: Float!
  }
`
