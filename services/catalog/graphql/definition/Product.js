const gql = require('graphql-tag')

exports.definition = gql`
  enum ContentOutputFormat {
    HTML
    Markdown
    Text
  }

  type HealthCheck {
    mongo: Float
  }

  type Query {
    node(id: ID!): Node
    ping: String!
    health: HealthCheck
    product(id: ID!): Product
    products(first: Int, last: Int, before: String, after: String): ProductConnection!
  }
  type Product implements Node {
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

    variantIds: [ ID! ]!

    dimensions: Dimensions

    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }
  type Seo {
    title: String!
    description: String
    image: String
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

  type ProductConnection {
    edges: [ ProductEdge! ]!
    pageInfo: PageInfo
  }
  type ProductEdge {
    cursor: String
    node: Product
  }
  type Mutation {
    addProduct(input: AddProductInput!): AddProductResponse
    updateProduct(input: UpdateProductInput!): UpdateProductResponse
    removeProduct(input: RemoveProductInput!): RemoveProductResponse
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
    title: String!
    description: String
    image: String
  }
  type AddProductResponse {
    clientMutationId: ID!
    product: Product!
  }

  input UpdateProductInput {
    clientMutationId: ID!
    id: ID!
    name: String
    caption: String
    description: String
    seo: SeoInput
    sections: [ SectionInput! ]
    tags: [ String! ]
    dimensions: DimensionsInput
    metadata: JSON
  }
  type UpdateProductResponse {
    clientMutationId: ID!
    product: Product!
  }

  input RemoveProductInput {
    clientMutationId: ID!
    id: ID!
  }
  type RemoveProductResponse {
    clientMutationId: ID!
  }

  interface Node {
    id: ID!
  }

  interface Entity {
    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }

  interface Taggable {
    tags: [ String! ]!
  }

  interface Medium {
    id: ID!
    url: String!
  }
`
