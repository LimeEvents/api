const reducers = {
  ProductAdded (entity, { _timestamp, _type, ...event }) {
    return {
      ...entity,
      ...event,
      created: _timestamp,
      updated: _timestamp
    }
  },
  ProductUpdated (entity, { _timestamp, _type, ...event }) {
    return {
      ...entity,
      ...event,
      updated: _timestamp
    }
  },
  ProductRemoved (entity, event) {
    return null
  }
}

exports.reduce = (entity, event) => {
  const fn = reducers[event._type]
  if (fn) return fn(entity, event)
  return entity
}
