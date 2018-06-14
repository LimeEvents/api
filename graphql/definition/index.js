const gql = require('graphql-tag')

exports.definition = gql`
  type Query {
    ping: String!
    health: HealthCheck!
  }

  type HealthCheck {
    mongo: Float
  }
`
