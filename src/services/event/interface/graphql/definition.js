const gql = require('graphql-tag')

exports.definition = gql`
  scalar DateTime
  scalar Url

  type Query {
    node(id: ID!): Node
    event(id: ID!): Event
    events(filter: EventFilter, first: Int, last: Int, before: String, after: String): EventConnection!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): CreateEventResponse
    updateEvent(input: UpdateEventInput!): UpdateEventResponse
    cancelEvent(input: CancelEventInput!): CancelEventResponse
    rescheduleEvent(input: RescheduleEventInput!): RescheduleEventResponse
  }

  input EventFilter {
    locationId: ID
    externalId: ID
  }

  type EventConnection {
    pageInfo: PageInfo!
    edges: [ EventEdge! ]!
  }

  type EventEdge {
    cursor: String!
    node: Event!
  }

  type Event implements Node {
    id: ID!

    locationId: ID!

    name: String!
    image: Url!
    video: Url
    caption: String
    description: String

    doorsOpen(format: String): DateTime!
    start(format: String): DateTime!
    end(format: String): DateTime!
    cancelled(format: String): DateTime

    url: Url!
    acceptDiscounts: Boolean!

    price: Int!
    feeDistribution: Int!

    inventory: Inventory

    externalIds: [ ID! ]!

    contentRating: ContentRating
    minimumAge: Int

    notes: [ String! ]
  }

  type Inventory {
    available: Int!
    sold: Int!
    reserved: Int!
    capacity: Int!
  }

  type PageInfo {
    startCursor: String!
    endCursor: String!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  interface Node {
    id: ID!
  }

  enum ContentRating {
    G
    PG
    PG13
    R
  }

  input CreateEventInput {
    clientMutationId: ID!

    locationId: ID!
    capacity: Int

    name: String!
    caption: String
    description: String
    slug: String
    image: Url!
    video: Url
    """ Ticket URL """
    url: Url

    acceptDiscounts: Boolean

    start: DateTime!
    doorsOpen: DateTime
    end: DateTime

    price: Int!

    externalIds: [ ID! ]

    contentRating: ContentRating
    minimumAge: Int
    feeDistribution: Int!
    notes: [ String! ]
  }

  type CreateEventResponse {
    clientMutationId: ID!
    event: Event!
  }


  input UpdateEventInput {
    clientMutationId: ID!
    id: ID!
    name: String
    caption: String
    description: String
    slug: String
    image: Url
    video: Url
    acceptDiscounts: Boolean
    price: Int
    contentRating: ContentRating
    minimumAge: Int
  }

  type UpdateEventResponse {
    clientMutationId: ID!
    event: Event!
  }

  input CancelEventInput {
    clientMutationId: ID!
    id: ID!
  }

  type CancelEventResponse {
    clientMutationId: ID!
    event: Event!
  }

  input RescheduleEventInput {
    clientMutationId: ID!
    id: ID!
    start: DateTime!
    end: DateTime
    doorsOpen: DateTime
  }

  type RescheduleEventResponse {
    clientMutationId: ID!
    event: Event!
  }
`
