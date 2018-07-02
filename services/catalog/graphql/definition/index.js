const gql = require('graphql-tag')
const { definition: Channel } = require('./Channel')
const { definition: Product } = require('./Product')
const { definition: Variant } = require('./Variant')

exports.definition = gql`
  scalar JSON
  scalar DateTime
  scalar Url

  type PageInfo {
    startCursor: String!
    endCursor: String!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
  ${Product}
  ${Variant}
  ${Channel}
`
