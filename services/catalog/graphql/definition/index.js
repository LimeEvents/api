const gql = require('graphql-tag')
const { definition: Channel } = require('./Channel')
const { definition: Product } = require('./Product')
const { definition: Offer } = require('./Offer')
const { definition: Health } = require('./Health')

const { definition: Visible } = require('./Visible')
const { definition: Searchable } = require('./Searchable')
const { definition: Node } = require('./Node')
const { definition: Entity } = require('./Entity')

exports.definition = gql`
  scalar JSON
  scalar DateTime
  scalar Url

  type Query {
    ping: String!
  }

  type PageInfo {
    startCursor: String
    endCursor: String
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }
  ${Product}
  ${Offer}
  ${Channel}
  ${Health}

  ${Visible}
  ${Entity}
  ${Searchable}
  ${Node}
`
