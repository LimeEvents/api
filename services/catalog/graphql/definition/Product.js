const gql = require('graphql-tag')

exports.definition = gql`
  enum ContentOutputFormat {
    HTML
    Markdown
    Text
  }

  extend type Query {
    product(id: ID!): Product
    products(first: Int, after: String): ProductConnection!
  }
  type Product implements Node & Searchable & Visible {
    id: ID!

    ## Viewable ##
    url: String!
    media(first: Int, after: String): ProductMediaConnection!
    name: String!
    caption: String
    description: String
    sections: [ ContentSection! ]!

    variants(first: Int, after: String): ProductVariantConnection!

    ## Searchable ##
    seo: Seo!
    tags(first: Int, after: String): ProductTagConnection!

    dimensions: Dimensions

    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }

  type ProductTagConnection implements TagConnection {
    edges: [ ProductTagEdge! ]!
    pageInfo: PageInfo!
  }

  type ProductTagEdge implements TagEdge {
    node: Tag!
    cursor: String
  }

  type ContentSection {
    title: String!
    """ Supports Markdown, HTML, plain text """
    body(format: ContentOutputFormat = Markdown): String!
  }

  type ProductMediaConnection implements MediaConnection {
    edges: [ ProductMediaEdge! ]!
    pageInfo: PageInfo!
  }

  type ProductMediaEdge implements MediaEdge {
    node: Media!
    cursor: String
  }

  type Dimensions {
    width: Float!
    height: Float!
    depth: Float!
    weight: Float!
  }

  type ProductVariantConnection {
    edges: [ ProductVariantEdge! ]!
    pageInfo: PageInfo
  }
  type ProductVariantEdge {
    node: Product!
    cursor: String
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
    parentId: ID
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
    parentId: ID
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
`
