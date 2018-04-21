const assert = require('assert')
const uuid = require('uuid')
const slug = require('slug')
const { Event } = require('@vivintsolar/repository')

exports.get = (viewer, { performer }) => {
  assert(performer, 'Performer not found')
  return performer
}
exports.find = (viewer, { performers }) => {
  return performers.map(performer => exports.get(viewer, { performer }))
}
exports.register = (viewer, { performer }) => {
  assert(viewer, 'Unauthenticated')
  assert(any(viewer.roles, ['admin', 'system', 'administrator']), 'Unauthorized')
  if (!performer.id) performer = { id: uuid.v4(), ...performer }
  if (!performer.slug) performer = { ...performer, slug: slug(performer.name) }
  return [
    new Event('PerformerRegistered', performer)
  ]
}
exports.update = (viewer, { performer, update }) => {

}
exports.remove = (viewer, { performer }) => {

}

function any (roles, necessary) {
  return necessary.some(role => roles.includes(role))
}
