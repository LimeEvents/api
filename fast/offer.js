require('dotenv').load()
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')
const gql = require('graphql-tag')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const OFFER_SOURCE = 'offer.source'
const OFFER_VIEW = 'offer.view'
const VARIANT_VIEW = 'variant.view'

const resolvers = {
  Query: {

  },
  Mutation: {
    async addOffer (source, { input: { clientMutationId, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'), 'Unauthorized')

      const variant = await getVariant(input.variantId)
      assert(variant, `Variant with ID "${input.variantId}" does not exist`)

      const id = uuid()
      const now = Date.now()
      await collection(OFFER_SOURCE).insert({
        id,
        ...input,
        _timestamp: now,
        _type: 'OfferAdded'
      })
      await collection(OFFER_VIEW).insert({
        id,
        ...input,
        created: now,
        updated: now
      })
      return { clientMutationId, id }
    }
  },
  Offer: {
    id: ({ id }) => toGlobalId('Offer', id)
  },
  AddOfferResponse: {
    offer: refetchOffer()
  }
}

const definition = gql`
  extend type Variant {
    offers(first: Int, last: Int, before: String, after: String): OfferConnection!
  }

  type OfferConnection {
    edges: [ OfferEdge! ]!
    pageInfo: PageInfo
  }
  type OfferEdge {
    node: Offer
    cursor: String
  }
  type Offer {
    variantId: ID!
    paymentMethods: PaymentMethodConnection
    price: Currency!

    created: DateTime
    updated: DateTime
  }

  type Currency {
    code: CurrencyCode
    value: Float!
  }
  type PaymentMethodConnection {
    edges: [ PaymentMethodEdge! ]!
    pageInfo: PageInfo
  }
  type PaymentMethodEdge {
    node: PaymentMethod!
  }
  enum CurrencyCode {
    USD
  }
  union PaymentMethod = Loan | AcceptedPaymentMethod

  type Loan {
    term: LoanTerm
  }

  enum AcceptedPaymentMethod {
    PayPal
    GoogleCheckout
    Cash
    VISA
    MasterCard
    AmericanExpress
    Discover
    ApplePay
    ByInvoice
    DirectDebit
  }

  type LoanTerm {
    months: Int!
    # schedule: LoanPaymentSchedule
  }
  # type LoanPaymentSchedule {

  # }
  extend type Mutation {
    addOffer(input: AddOfferInput!): AddOfferResponse
  }
  input AddOfferInput {
    clientMutationId: ID!
    channelId: ID!
    variantId: ID!
    price: Int!
    paymentMethods: [ AcceptedPaymentMethod! ]
  }
  type AddOfferResponse {
    clientMutationId: ID!
    offer: Offer!
  }
`

function getVariant (id) {
  id = fromGlobalId(id).id
  return collection(VARIANT_VIEW).findOne({ id })
}
function getOffer (id) {
  return collection(OFFER_VIEW).findOne({ id })
}
function refetchOffer (field = 'id') {
  return async (source, args, { viewer }) => {
    return getOffer(args.id || source.id)
  }
}
exports.definition = definition
exports.resolvers = resolvers
