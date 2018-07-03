const gql = require('graphql-tag')

exports.definition = gql`
  extend type Product {
    offers(first: Int, after: String): ProductOffersConnection!
  }

  type ProductOffersConnection {
    edges: [ ProductOfferEdge! ]!
    pageInfo: PageInfo!
  }
  type ProductOfferEdge {
    node: Offer!
    cursor: String
  }
  type Offer implements Node {
    id: ID!
    price: Float!
    product: Product!
    currency: Currency!
  }
  enum Currency {
    USD
  }

  extend type Mutation {
    addProductOffer(input: AddProductOfferInput!): AddProductOfferResponse
  }

  input AddProductOfferInput {
    clientMutationId: ID!
    """ Product ID """
    id: ID!
    price: Float!
    currency: Currency = USD
  }
  type AddProductOfferResponse {
    clientMutationId: ID!
    offer: Offer!
    product: Product!
  }
`
