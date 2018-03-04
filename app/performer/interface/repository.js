const Repo = require('@nerdsauce/adapters/mongo/repository')

exports.reducer = (performer = {}, event = {}) => {
  const entity = Object.assign({}, performer)
  return {
    PerformerRegistered () {
      entity.id = event.id
      entity.name = event.name
      entity.description = event.description
      entity.caption = event.caption
      entity.images = event.images
      entity.videos = event.videos
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
  }[event.meta.type]()
}
exports.repository = new Repo('performer_source', exports.reducer)
