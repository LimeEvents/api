const gql = require('graphql-tag')

exports.Product = gql`
  # extend type Query {
  #   product(id: ID!): Product
  # }
  type Product {
    id: ID!

    ## Viewable ##
    url: String!
    # media(type: MediumType, first: Int, last: Int, before: String, after: String): MediumConnection!
    name: String!
    caption: String
    description: String
    seo: Seo!
    sections: [ ContentSection! ]!

    tags: [ String! ]!

    variants(first: Int, last: Int, before: String, after: String): VariantConnection!

    dimensions: Dimensions

    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }
  type Seo {
    image: String!
    title: String!
    description: String!
  }

  type ContentSection {
    title: String!
    """ Supports Markdown, HTML, plain text """
    body(format: ContentOutputFormat = Markdown): String!
  }

  type Dimensions {
    width: Float!
    height: Float!
    depth: Float!
    weight: Float!
  }

  extend type Mutation {
    addProduct(input: AddProductInput!): AddProductResponse
  }

  input AddProductInput {
    clientMutationId: ID!
    name: String!
    caption: String
    description: String
    seo: SeoInput
    sections: [ SectionInput! ]
    tags: [ String! ]
    dimensions: DimensionsInput
    metadata: JSON
  }
  input SectionInput {
    title: String!
    """ Markdown """
    body: String!
  }
  input DimensionsInput {
    width: Float!
    height: Float!
    depth: Float!
    weight: Float!
  }
  input SeoInput {
    image: String!
    title: String!
    description: String!
  }
  type AddProductResponse {
    clientMutationId: ID!
    product: Product!
  }
`
