const slugify = require('slug')
const { connectionFromArray, fromGlobalId, toGlobalId } = require('graphql-relay')

exports.resolvers = {
  Node: {
    __resolveType ({ id }) {
      return fromGlobalId(id).type
    }
  },
  Query: {
    node: refetchPerformer(),
    performer: refetchPerformer(),
    performers: findPerformers
  },
  Mutation: {
    async registerPerformer (source, { input }, { viewer, application }) {
      const { id } = await application.register(viewer, input)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Performer', id) }
    },
    async updatePerformer (source, { input }, { viewer, application }) {
      const { id } = await application.update(viewer, { ...input, id: fromGlobalId(input.id).id })
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Performer', id) }
    },
    async removePerformer (source, { input }, { viewer, application }) {
      const { id } = await application.remove(viewer, fromGlobalId(input.id).id)
      return { clientMutationId: input.clientMutationId, id: toGlobalId('Performer', id) }
    }
  },
  RegisterPerformerResponse: {
    performer: refetchPerformer()
  },
  UpdatePerformerResponse: {
    performer: refetchPerformer()
  },
  RemovePerformerResponse: {
    performers: findPerformers
  },
  Performer: {
    slug ({ slug, name }) {
      return slug || slugify(name).toLowerCase()
    }
  }
}

function refetchPerformer (field = 'id') {
  return async (source, args, { viewer, application }) => {
    const id = fromGlobalId(args[field] || source[field]).id
    const performer = await application.get(viewer, id)
    return { ...performer, id: toGlobalId('Performer', id) }
  }
}

async function findPerformers (source, args, { viewer, application }) {
  if (args.first) args.first = Math.min(args.first, 50)
  if (args.last) args.last = Math.min(args.last, 50)
  const performers = await application.find(viewer, args)
  const { edges, pageInfo } = connectionFromArray(performers, args)

  return {
    pageInfo,
    edges: edges.map(({ node, cursor }) => {
      return {
        cursor,
        node: { ...node, id: toGlobalId('Performer', node.id) }
      }
    })
  }
}
