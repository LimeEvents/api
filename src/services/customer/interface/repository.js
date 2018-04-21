const memo = require('lodash.memoize')
const { Repository } = require('@vivintsolar/mongo-repository')

const reducers = {
  CustomerCreated (entity, event) {
    const {
      id,
      address = null,
      contact = null,
      _timestamp: created
    } = event
    return { ...entity, id, address, contact, created }
  }
}

const reducer = (entity = {}, event) => {
  entity = { ...entity }
  const fn = reducers[event._type]
  if (typeof fn === 'function') entity = fn(entity, event)
  entity.updated = event._timestamp
  return entity
}
exports.repository = memo((tenantId) => new Repository({ name: 'customer', reducer, tenantId }))
