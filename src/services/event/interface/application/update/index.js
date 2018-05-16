const assert = require('assert')

const domain = (viewer, { event, updates }) => {
  // Do auth check

  assert(event, 'Cannot update non-existent event')
  assert(updates, 'Must provide updates')

  updates = Object.entries(updates)
    .reduce((prev, [ key, value ]) => {
      if (event[key] !== value) prev[key] = value
      return prev
    }, {})

  return [{
    id: event.id,
    _type: 'EventUpdated',
    _timestamp: Date.now(),
    ...updates
  }]
}

const application = (repo, services) => async (viewer, updates) => {
  const event = await repo.get(updates.id)
  return repo.save(
    domain(viewer, { updates, event })
  )
}

const reducer = {
  EventUpdated (entity, event) {
    entity = { ...entity }
    if (event.name) entity.name = event.name
    if (event.caption) entity.caption = event.caption
    if (event.description) entity.description = event.description
    if (event.slug) entity.slug = event.slug
    if (event.image) entity.image = event.image
    if (event.video) entity.video = event.video
    if (event.url) entity.url = event.url
    if (event.acceptDiscounts) entity.acceptDiscounts = event.acceptDiscounts
    if (event.price) entity.price = event.price
    if (event.contentRating) entity.contentRating = event.contentRating
    if (event.minimumAge) entity.minimumAge = event.minimumAge
    return entity
  }
}

exports.domain = domain
exports.application = application
exports.reducer = reducer
