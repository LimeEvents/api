const gql = require('graphql-tag')
const { definition: Channel } = require('./Channel')
const { definition: Product } = require('./Product')

exports.definition = gql`
  scalar JSON
  scalar DateTime
  type PageInfo {
    startCursor: String!
    endCursor: String!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
  ${Product}
  ${Channel}
`
