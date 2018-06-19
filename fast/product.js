require('dotenv').load()
const { toGlobalId, connectionFromArray } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')
const gql = require('graphql-tag')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const VARIANT_VIEW = 'variant.view'
const PRODUCT_VIEW = 'product.view'
const PRODUCT_SOURCE = 'product.source'

const resolvers = {
  Query: {
    product: refetchProduct(),
    async products (source, args, { viewer }) {
      const products = await collection(PRODUCT_VIEW).find({})
      return connectionFromArray(products, args)
    }
  },
  Mutation: {
    async addProduct (source, { input: { clientMutationId, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'), 'Unauthorized')
      const id = uuid()
      const now = Date.now()
      await collection(PRODUCT_SOURCE).insert([{
        id,
        ...input,
        _timestamp: now,
        _type: 'ProductAdded'
      }])
      await collection(PRODUCT_VIEW).insert({
        id,
        ...input,
        created: now,
        updated: now
      })

      return { clientMutationId, id }
    }
  },
  Product: {
    id: ({ id }) => toGlobalId('Product', id),
    seo: ({ seo, name, caption, description, image }) => {
      const _description = caption || description
      return {
        title: name,
        description: _description && _description.substr(0, 140),
        image,
        ...seo
      }
    },
    async variants ({ id }, args, { viewer }) {
      const variants = await collection(VARIANT_VIEW).find({ productId: toGlobalId('Product', id) })
      return connectionFromArray(variants, args)
    },
    sections ({ sections }) {
      return sections || []
    },
    tags ({ tags }) {
      return tags || []
    },
    metadata ({ metadata }) {
      return metadata || {}
    }
  },
  AddProductResponse: {
    product: refetchProduct()
  },
  UpdateProductResponse: {
    product: refetchProduct()
  },
  DiscontinueProductResponse: {
    product: refetchProduct()
  }
}

const definition = gql`

  type Query {
    product(id: ID!): Product
    products(first: Int, last: Int, before: String, after: String): ProductConnection!
  }
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
  type PageInfo {
    startCursor: String
    endCursor: String
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  type ProductEdge {
    cursor: String
    node: Product
  }
  type Mutation {
    addProduct(input: AddProductInput!): AddProductResponse
    updateProduct(input: UpdateProductInput!): UpdateProductResponse
    discontinueProduct(input: DiscontinueProductInput!): DiscontinueProductResponse
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
  }
  type UpdateProductResponse {
    clientMutationId: ID!
    product: Product!
  }

  input DiscontinueProductInput {
    clientMutationId: ID!
  }
  type DiscontinueProductResponse {
    clientMutationId: ID!
    product: Product!
  }
`

function getProduct (id) {
  return collection(PRODUCT_VIEW).findOne({ id })
  // return collection(CHANNEL_VIEW).findOne({ channel })
}
function refetchProduct (field = 'id') {
  return async (source, args, { viewer }) => {
    return getProduct(args.id || source.id)
  }
}

exports.definition = definition
exports.resolvers = resolvers
