const Repo = require('../../../lib/mongo/repository')
const emitter = require('../../../lib/emitter')

const reducer = (performer = {}, event = {}) => {
  const entity = Object.assign({
    images: [],
    videos: []
  }, performer)
  return {
    PerformerRegistered () {
      entity.id = event.meta.id
      entity.name = event.name
      entity.description = event.description
      entity.caption = event.caption
      entity.images = event.images || []
      entity.videos = event.videos || []
      return entity
    },
    PerformerRemoved () {
      return { id: event.meta.id, removed: true }
    },
    PerformerUpdated () {
      entity.name = event.name
      entity.description = event.description
      entity.caption = event.caption
      entity.images = event.images || []
      entity.videos = event.videos || []
    }
  }[event.meta.type]()
}
exports.repository = (tenantId) => new Repo('performer_source', reducer, emitter, tenantId)
