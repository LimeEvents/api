const gql = require('graphql-tag')

const { Variant } = require('./Variant')
const { interfaces } = require('./interfaces')
const { scalars } = require('./scalars')

const Query = gql`
  type Query {
    ping: String!
    health: HealthCheck!
  }

  type Mutation {
    deleteNode(input: DeleteNodeInput!): DeleteNodeResponse
  }

  input DeleteNodeInput {
    clientMutationId: ID!
    id: ID!
  }
  type DeleteNodeResponse {
    clientMutationId: ID!
  }

  type HealthCheck {
    mongo: Float
  }

  type PageInfo {
    startCursor: String!
    endCursor: String!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
`

exports.definition = [Query, Variant, interfaces, scalars]
