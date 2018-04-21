const assert = require('assert')
const uuid = require('uuid')
const slug = require('slug')
const { Event } = require('@vivintsolar/repository')

exports.get = (viewer, { performer }) => {
  assert(performer, 'Performer not found')
  assert(typeof performer.slug === 'string', 'Field "slug" is required on Performer')
  assert(typeof performer.name === 'string', 'Field "name" is required on Performer')
  assert(Array.isArray(performer.images), 'Field "images" is required on Performer')
  assert(Array.isArray(performer.videos), 'Field "videos" is required on Performer')

  return performer
}
exports.find = (viewer, { performers }) => {
  return performers.map(performer => exports.get(viewer, { performer }))
}
exports.register = (viewer, { performer }) => {
  assert(viewer, 'Unauthenticated')
  assert(any(viewer.roles, ['admin', 'system', 'administrator']), 'Unauthorized')
  if (!performer.id) performer = { id: uuid.v4(), ...performer }
  if (!performer.slug) performer = { ...performer, slug: slug(performer.name).toLowerCase() }
  return [
    new Event('PerformerRegistered', performer)
  ]
}
exports.update = (viewer, { performer, updates }) => {
  return [
    new Event('PerformerUpdated', {
      ...updates,
      id: performer.id
    })
  ]
}
exports.remove = (viewer, { performer }) => {
  assert(performer, 'Performer does not exist')
  return [
    new Event('PerformerRemoved', { id: performer.id })
  ]
}

function any (roles, necessary) {
  return necessary.some(role => roles.includes(role))
}
