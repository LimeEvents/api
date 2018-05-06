const gql = require('graphql-tag')

exports.definition = gql`
  scalar DateTime
  scalar Currency

  type Query {
    node(id: ID!): Node
    order(id: ID!): Order
    orders(filter: OrderFilter, first: Int, last: Int, before: String, after: String): OrderConnection!
    orderStatistics(startDate: Int!, endDate: Int!, performerId: ID, locationId: ID, eventId: ID): OrderStatistic!

    """ Number of orders in a time period """
    orderMetrics(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
  }

  input MetricFilter {
    """ If the values of the field should be combined """
    aggregate: OrderMetricAggregateField
    """ Field name to count value occurrances """
    count: OrderMetricCountField
    """ Required for 'count' queries """
    value: String

    """ Interval to break into buckets """
    interval: MetricInterval = week
    """ Date to start counting backward in intervals """
    start: DateTime
  }

  enum OrderMetricAggregateField {
    price
    tickets
    subtotal
    customerFee
    locationFee
    salesTax
    total
    amountPaid
    amountRefunded
  }

  enum OrderMetricCountField {
    type
    eventId
    fingerprint
  }

  enum MetricInterval {
    year
    quarter
    month
    week
    day
    hour
    minute
    second
  }

  type OrderMetricConnection {
    edges: [ OrderMetricEdge! ]!
    pageInfo: PageInfo
  }

  type OrderMetricEdge {
    cursor: String!
    node: OrderMetric!
  }

  type OrderMetric {
    type: MetricType!
    field: String!
    value: Int!
    timestamp: DateTime!
  }

  enum MetricType {
    aggregate
    count
  }

  input OrderFilter {
    eventId: ID
    locationId: ID
  }

  type OrderStatistic {
    startDate: Int!
    endDate: Int!
    """ Total number of orders created """
    orders: Int!
    """ Total number of tickets sold """
    ticketsSold: Int!
    """ Total gross """
    gross: Currency!
    """ Total net """
    net: Currency!
    """ Number of tickets that have been refunded """
    refunded: Int!
    """ Total amount refunded """
    refundedAmount: Currency!
    """ Amount collected in fees """
    fees: Currency!
    """ Amount colllected for taxes """
    salesTax: Currency!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): CreateOrderResponse
    chargeOrder(input: ChargeOrderInput!): ChargeOrderResponse
    refundOrder(input: RefundOrderInput!): RefundOrderResponse
    transferOrder(input: TransferOrderInput!): TransferOrderResponse
    reassignOrder(input: ReassignOrderInput!): ReassignOrderResponse
  }

  """ Create order """
  input CreateOrderInput {
    clientMutationId: ID!
    eventId: ID!
    tickets: Int!
  }
  type CreateOrderResponse {
    clientMutationId: ID!
    order: Order!
  }

  """ Pay for the order """
  input ChargeOrderInput {
    clientMutationId: ID!
    """ Order ID created from reserving tickets """
    id: ID!
    """ Customer Name """
    name: String!
    """ Customer Email """
    email: String!
    """ Payment token """
    source: String!
  }
  type ChargeOrderResponse {
    clientMutationId: ID!
    order: Order!
  }

  """ Refund (or partially refund) a customers payment """
  input RefundOrderInput {
    clientMutationId: ID!
    id: ID!
    """ Number of tickets to refund. Defaults to whole order """
    tickets: Int
  }
  type RefundOrderResponse {
    clientMutationId: ID!
    order: Order!
  }

  """ Transfer tickets to another event """
  input TransferOrderInput {
    clientMutationId: ID!
    """ Order ID """
    id: ID!
    """ Event tickets are transferring to """
    eventId: ID!
    """ Amount of tickets to transfer """
    tickets: Int!
  }
  type TransferOrderResponse {
    clientMutationId: ID!
    sourceOrder: Order!
    destinationOrder: Order!
  }

  """ Let other people pick up tickets at willcall """
  input ReassignOrderInput {
    clientMutationId: ID!
    id: ID!
    to: String!
    from: String!
  }
  type ReassignOrderResponse {
    clientMutationId: ID!
    order: Order!
  }

  type Order implements Node {
    id: ID!
    eventId: ID!

    """ Price of tickets when they were added to the order """
    price: Currency!

    """ Number of tickets on this order """
    tickets: Int!

    """ Price of all tickets """
    subtotal: Currency!

    """ Fee paid """
    customerFee: Currency!
    locationFee: Currency!

    """ Sales tax """
    salesTax: Currency!

    """ Total charged to card """
    total: Currency!

    """ Amount paid by the customer """
    amountPaid: Currency!
    """ Amount refunded to the customer """
    amountRefunded: Currency!

    fingerprint: ID
    willcall: [ String! ]!

    created: DateTime!
    updated: DateTime!
  }

  type OrderConnection {
    edges: [ OrderEdge! ]!
    pageInfo: PageInfo!
  }

  type OrderEdge {
    cursor: String!
    node: Order!
  }

  type PageInfo {
    startCursor: String
    endCursor: String
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  interface Node {
    id: ID!
  }
`
