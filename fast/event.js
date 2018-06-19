require('dotenv').load()
const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')
const assert = require('assert')
const memoize = require('lodash.memoize')
const Monk = require('monk')
const uuid = require('uuid/v4')
const gql = require('graphql-tag')

const connection = memoize(url => new Monk(url))
const collection = memoize(name => connection(process.env.MONGODB_URL).get(name))

const EVENT_SOURCE = 'event.source'
const EVENT_VIEW = 'event.view'

const definition = gql`
  extend type Query {
    event(id: ID!): Event
    events(first: Int, last: Int, before: String, after: String): EventConnection!
  }
  type Image {
    url: Url!
  }
  type Event {
    id: ID!
    name: String!
    caption: String
    description: String
    image: Url
    start: DateTime
    cancelled: DateTime
  }
  type EventEdge {
    node: Event
    cursor: String
  }
  type EventConnection {
    pageInfo: PageInfo
    edges: [ EventEdge! ]!
  }

  extend type Mutation {
    scheduleEvent(input: ScheduleEventInput!): ScheduleEventResponse
    rescheduleEvent(input: RescheduleEventInput!): RescheduleEventResponse
    cancelEvent(input: CancelEventInput!): CancelEventResponse
    updateEvent(input: UpdateEventInput!): UpdateEventResponse
  }
  input ImageInput {
    url: Url!
  }
  input ScheduleEventInput {
    clientMutationId: ID!
    name: String!
    caption: String
    description: String
    image: ImageInput!
    start: DateTime
  }
  type ScheduleEventResponse {
    clientMutationId: ID!
    event: Event!
  }

  input RescheduleEventInput {
    clientMutationId: ID!
    id: ID!
    start: DateTime!
  }
  type RescheduleEventResponse {
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

  input UpdateEventInput {
    clientMutationId: ID!
    id: ID!
    name: String
    caption: String
    description: String
    image: ImageInput
  }
  type UpdateEventResponse {
    clientMutationId: ID!
    event: Event!
  }
`

const resolvers = {
  Query: {
    event: refetchEvent(),
    async events (source, args, { viewer }) {
      console.log('thing', EVENT_VIEW)
      const events = await collection(EVENT_VIEW).find({})
      return connectionFromArray(events, args)
    }
  },
  Event: {
    id: ({ id }) => toGlobalId('Event', id)
  },
  Mutation: {
    async scheduleEvent (source, { input: { clientMutationId, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      const id = uuid()
      const now = Date.now()
      await collection(EVENT_SOURCE).insert([{
        id,
        ...input,
        _timestamp: now,
        _type: 'EventScheduled'
      }])
      await collection(EVENT_VIEW).insert({ id, ...input, created: now, updated: now })
      return { clientMutationId, id }
    },
    async rescheduleEvent (source, { input: { clientMutationId, id, start } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      await collection(EVENT_SOURCE).insert([{
        id,
        start,
        _timestamp: now,
        _type: 'EventRescheduled'
      }])
      await collection(EVENT_VIEW).update({ id }, { $set: { start, updated: now } })
      return { clientMutationId, id }
    },
    async cancelEvent (source, { input: { clientMutationId, id, start } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      await collection(EVENT_SOURCE).insert([{
        id,
        start,
        _timestamp: now,
        _type: 'EventCancelled'
      }])
      await collection(EVENT_VIEW).update({ id }, { $set: { cancelled: now, updated: now } })
      return { clientMutationId, id }
    },
    async updateEvent (source, { input: { clientMutationId, id, ...input } }, { viewer }) {
      assert(viewer, 'Unauthenticated')
      assert(viewer.roles.includes('administrator'))
      id = fromGlobalId(id).id
      const now = Date.now()
      await collection(EVENT_SOURCE).insert([{
        id,
        ...input,
        _timestamp: now,
        _type: 'EventUpdated'
      }])
      await collection(EVENT_VIEW).update({ id }, { $set: { updated: now, ...input } })
      return { clientMutationId, id }
    }
  },
  ScheduleEventResponse: {
    event: refetchEvent()
  },
  RescheduleEventResponse: {
    event: refetchEvent()
  },
  CancelEventResponse: {
    event: refetchEvent()
  },
  UpdateEventResponse: {
    event: refetchEvent()
  }
}

function getEvent (id) {
  return collection(EVENT_VIEW).findOne({ id })
}
function refetchEvent (field = 'id') {
  return async (source, args, { viewer }) => {
    return getEvent(args.id || source.id)
  }
}

exports.definition = definition
exports.resolvers = resolvers

// fragment EventFragment on Event {
//   id
//   name
//   caption
//   description
//   image
//   start
//    cancelled
// }

// query Events {
//   events {
//     edges {
//       node {
//         ...EventFragment
//       }
//     }
//   }
// }

// mutation ScheduleEvent($schedule: ScheduleEventInput!) {
//   scheduleEvent(input: $schedule) {
//     clientMutationId
//     event {
//       ...EventFragment
//     }
//   }
// }

// mutation RescheduleEvent($reschedule: RescheduleEventInput!){
//   rescheduleEvent(input: $reschedule){
//     clientMutationId
//     event {
//       ...EventFragment
//     }
//   }
// }

// mutation UpdateEvent($update: UpdateEventInput!) {
//   updateEvent(input: $update) {
//     clientMutationId
//     event {
//       ...EventFragment
//     }
//   }
// }

// mutation CancelEvent($cancel: CancelEventInput!) {
//   cancelEvent(input: $cancel){
//     clientMutationId
//     event {
//       ...EventFragment
//     }
//   }
// }
