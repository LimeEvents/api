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
  console.log('reduce', event._type)
  const fn = reducers[event._type]
  console.log('reducer', fn)
  if (typeof fn === 'function') entity = fn(entity, event)
  entity.updated = event._timestamp
  console.log('after reduce', entity)
  return entity
}
exports.repository = memo((tenantId) => new Repository({ name: 'customer', reducer, tenantId }))
