const gql = require('graphql-tag')

exports.definition = gql`
  extend type Query {
    channel(id: ID!): Channel
    channels(first: Int, last: Int, before: String, after: String): ChannelConnection!
  }

  type ChannelConnection {
    edges: [ ChannelEdge! ]!
    pageInfo: PageInfo
  }
  type ChannelEdge {
    node: Channel
    cursor: String
  }
  type Channel {
    id: ID!
    name: String!

    metadata: JSON!

    created: DateTime!
    updated: DateTime!

    products: ChannelProductConnection!

    enabled: DateTime
    disabled: DateTime
    removed: DateTime
  }


  type ChannelProductConnection {
    edges: [ ChannelProductEdge! ]!
    pageInfo: PageInfo
  }
  type ChannelProductEdge {
    cursor: String
    node: Product
  }

  extend type Mutation {
    addChannel(input: AddChannelInput!): AddChannelResponse
    updateChannel(input: UpdateChannelInput!): UpdateChannelResponse
    enableChannel(input: EnableChannelInput!): EnableChannelResponse
    disableChannel(input: DisableChannelInput!): DisableChannelResponse
    publishChannelProduct(input: PublishChannelProductInput!): PublishChannelProductResponse
    unpublishChannelProduct(input: UnpublishChannelProductInput!): UnpublishChannelProductResponse
    removeChannel(input: RemoveChannelInput!): RemoveChannelResponse
  }

  input AddChannelInput {
    clientMutationId: ID!
    name: String!
    metadata: JSON
  }
  type AddChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input UpdateChannelInput {
    clientMutationId: ID!
    id: ID!
    name: String
    metadata: JSON
  }
  type UpdateChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input EnableChannelInput {
    clientMutationId: ID!
    id: ID!
    date: DateTime
  }
  type EnableChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input DisableChannelInput {
    clientMutationId: ID!
    id: ID!
    date: DateTime
  }
  type DisableChannelResponse {
    clientMutationId: ID!
    channel: Channel!
  }

  input PublishChannelProductInput {
    clientMutationId: ID!
    id: ID!
    productId: ID!
    date: DateTime
  }
  type PublishChannelProductResponse {
    clientMutationId: ID!
    product: Product!
    channel: Channel!
  }

  input UnpublishChannelProductInput {
    clientMutationId: ID!
    id: ID!
    productId: ID!
    date: DateTime
  }
  type UnpublishChannelProductResponse {
    clientMutationId: ID!
    product: Product!
    channel: Channel!
  }

  input RemoveChannelInput {
    clientMutationId: ID!
    id: ID!
  }
  type RemoveChannelResponse {
    clientMutationId: ID!
  }
`
