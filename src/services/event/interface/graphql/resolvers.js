const moment = require('moment')
const { fromGlobalId, toGlobalId, connectionFromArray } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType ({ id }) {
      return fromGlobalId(id).type
    }
  },
  Query: {
    node: refetchEvent(),
    event: refetchEvent(),
    async events (source, args, { viewer, application }, info) {
      if (args.first) args.first = Math.min(args.first, 50)
      if (args.last) args.last = Math.min(args.last, 50)
      if (!args.first && !args.last) {
        args.first = 50
      }
      const events = await application.find(viewer, args)
      const { pageInfo, edges } = connectionFromArray(events, args)
      return {
        pageInfo,
        edges: edges.map(
          ({ node, cursor }) => ({
            cursor,
            node: { ...node, id: toGlobalId('Event', node.id) }
          })
        )
      }
    }
  },
  Mutation: {
    async createEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.create(viewer, input)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    },
    async updateEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.update(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    },
    async cancelEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.cancel(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    },
    async rescheduleEvent (source, { input }, { viewer, application }, info) {
      const { id } = await application.reschedule(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Event', id) }
    }
  },
  Event: {
    doorsOpen: format('doorsOpen'),
    start: format('start'),
    end: format('end'),
    cancelled: format('cancelled'),
    image ({ image }, { size = 100 }) {
      if (!image) return image
      if (image.startsWith('https://wiseguys')) return `${image}?w=${size}&h=${size}&fit=crop&crop=faces,center`
      return `${image}-/resize/${size}x/`
    },
    video ({ video }) {
      if (video) {
        const results = video.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i)
        if (results) return `https://www.youtube.com/embed/${results[1]}`
      }
      return video
    }
  },
  CreateEventResponse: {
    event: refetchEvent()
  },
  CancelEventResponse: {
    event: refetchEvent()
  },
  RescheduleEventResponse: {
    event: refetchEvent()
  },
  UpdateEventResponse: {
    event: refetchEvent()
  }
}

function refetchEvent (field = 'id') {
  return async (source, args, { viewer, application }, info) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const event = await application.get(viewer, id)
    return { ...event, id: toGlobalId('Event', id) }
  }
}

function format (field) {
  return (source, { format }) => {
    if (!format) return source[field]
    return source[field] && moment(source[field]).format(format)
  }
}
