const gql = require('graphql-tag')

exports.interfaces = gql`
  # interface Product {
  #   id: ID!
  #   type: ProductType!
  #   variants: VariantConnection!
  #   priceRange: PriceRange!
  #   inventory: Inventory!
  # }

  interface Taggable {
    tags: [ String! ]!
  }

  """ Entities that have public facing websites """
  # interface Viewable {
  #   url: String!
  #   name: String!
  #   caption: String!
  #   description: String!
  #   sections: [ ContentSection! ]!
  #   media(type: MediumType, first: Int, last: Int, before: String, after: String): MediumConnection
  #   seo: Seo!
  # }

  interface Medium {
    id: ID!
    url: String!
  }

  interface Node {
    id: ID!
  }

  interface Entity {
    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }
`
