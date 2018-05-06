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
    cancelEvent(input: CancelEventInput!): CancelEventResponse
    rescheduleEvent(input: RescheduleEventInput!): RescheduleEventResponse
  }

  input EventFilter {
    locationId: ID
    performerId: ID
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

    performerIds: [ ID! ]!
    name: String!
    image: Url!
    video: Url
    caption: String
    description: String

    doorsOpen: DateTime!
    start: DateTime!
    end: DateTime!
    cancelled: DateTime

    price: Int!
    feeDistribution: Int!

    inventory: Inventory

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

    performerIds: [ ID! ]!
    name: String!
    slug: String
    image: Url!

    start: DateTime!
    doorsOpen: DateTime
    end: DateTime

    price: Int!

    contentRating: ContentRating
    minimumAge: Int
    feeDistribution: Int!
    notes: [ String! ]
  }

  type CreateEventResponse {
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
