const gql = require('graphql-tag')

exports.definition = gql`
  extend type Query {
    variant(id: ID!): Variant
  }

  extend type Product {
    variants(first: Int, last: Int, before: String, after: String): ProductVariantConnection
  }

  type Variant implements Node & Entity {
    id: ID!
    """ Unique name for this variant """
    name: String!

    """ Product ID to associate this Variant to """
    productId: ID!

    """ Unique identifier to tie this variant to fulfillment and inventory systems """
    sku: String

    """ Image of this variant (if visually different from the product) """
    image: Url

    """ Additional metadata about this variant """
    metadata: JSON!

    """ Date in epoch milliseconds of variant creation """
    created: DateTime!

    """ Date in epoch milliseconds of last modified date """
    updated: DateTime!
  }

  type ProductVariantConnection {
    pageInfo: PageInfo
    edges: [ ProductVariantEdge! ]!
  }
  type ProductVariantEdge {
    node: Variant
    cursor: String
  }

  extend type Mutation {
    addProductVariant(input: AddProductVariantInput!): AddProductVariantResponse
  }

  input AddProductVariantInput {
    clientMutationId: ID!
    id: ID!
    name: String!
    sku: String
    image: Url
    metadata: JSON
  }
  type AddProductVariantResponse {
    clientMutationId: ID!
    variant: Variant!
  }
`
