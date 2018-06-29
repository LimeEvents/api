require('dotenv').load()
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')
const gql = require('graphql-tag')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const VARIANT_SOURCE = 'variant.source'
const VARIANT_VIEW = 'variant.view'
const PRODUCT_VIEW = 'product.view'

const resolvers = {
  Query: {
    variant: refetchVariant()
  },
  Mutation: {
    async addProductVariant (source, { input: { clientMutationId, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'), '')
      const product = await getProduct(fromGlobalId(input.productId).id)
      assert(product, `Product with ID "${input.productId}" does not exist`)
      const id = uuid()
      const now = Date.now()
      await collection(VARIANT_SOURCE).insert([{
        id,
        ...input,
        _timestamp: now,
        _type: 'ProductVariantAdded'
      }])
      await collection(VARIANT_VIEW).insert({
        id,
        ...input,
        created: now,
        updated: now
      })
      return { clientMutationId, id }
    }
  },
  AddProductVariantResponse: {
    variant: refetchVariant()
  },
  Variant: {
    id: ({ id }) => toGlobalId('Variant', id),
    // product: refetchProduct('productId')
    metadata: ({ metadata }) => metadata || {}
  }
  // Product: {
  //   async variants ({ id }, args) {
  //     const variants = await collection(VARIANT_VIEW).find({ productId: id })
  //     return connectionFromArray(variants, args)
  //   }
  // }
}

const definition = gql`
  extend type Query {
    variant(id: ID!): Variant
  }
  # extend type Product {
  #   variants(first: Int, last: Int, before: String, after: String): VariantConnection!
  # }
  type Variant {
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

  type VariantConnection {
    pageInfo: PageInfo
    edges: [ VariantEdge! ]!
  }
  type VariantEdge {
    node: Variant
    cursor: String
  }

  extend type Mutation {
    addProductVariant(input: AddProductVariantInput!): AddProductVariantResponse
  }

  input AddProductVariantInput {
    clientMutationId: ID!
    productId: ID!
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

function getVariant (id) {
  return collection(VARIANT_VIEW).findOne({ id })
}
function getProduct (id) {
  return collection(PRODUCT_VIEW).findOne({ id })
}
function refetchVariant (field = 'id') {
  return async (source, args, { viewer }) => {
    return getVariant(args.id || source.id)
  }
}
exports.definition = definition
exports.resolvers = resolvers
