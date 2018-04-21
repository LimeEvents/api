const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/mongo-repository')

const reducers = {
  PerformerRegistered (entity, event) {
    entity.id = event.id
    entity.name = event.name
    entity.slug = event.slug
    entity.description = event.description
    entity.caption = event.caption
    entity.images = event.images || []
    entity.videos = event.videos || []
    entity.created = event._timestamp
    return entity
  },
  PerformerRemoved (entity, event) {
    return null
  },
  PerformerUpdated (entity, event) {
    entity.name = event.name
    entity.description = event.description
    entity.caption = event.caption
    entity.images = event.images || []
    entity.videos = event.videos || []
    return entity
  }
}

const reducer = (entity = {}, event = {}) => {
  entity = {
    ...entity,
    images: [],
    videos: []
  }
  const results = reducers[event._type](entity, event)
  if (results) results.updated = event._timestamp
  return results
}
exports.repository = memo((tenantId) => new Repository({ name: 'performer', reducer, tenantId }))
