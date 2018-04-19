const { Repository } = require('@vivintsolar/mongo-repository')

const reducer = (performer = {}, event = {}) => {
  const entity = Object.assign({
    images: [],
    videos: []
  }, performer)
  return {
    PerformerRegistered () {
      entity.id = event.id
      entity.name = event.name
      entity.description = event.description
      entity.caption = event.caption
      entity.images = event.images || []
      entity.videos = event.videos || []
      return entity
    },
    PerformerRemoved () {
      return { id: event.id, removed: true }
    },
    PerformerUpdated () {
      entity.name = event.name
      entity.description = event.description
      entity.caption = event.caption
      entity.images = event.images || []
      entity.videos = event.videos || []
    }
  }[event._type]()
}
exports.repository = (tenantId) => new Repository({ name: 'performer', reducer, tenantId })
