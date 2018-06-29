const reducers = {
  ProductVariantAdded (entity, { _timestamp, _type, ...event }) {
    return {
      ...entity,
      ...event,
      created: _timestamp,
      updated: _timestamp
    }
  }
}

exports.reduce = (entity, event) => {
  const fn = reducers[event._type]
  if (fn) return fn(entity, event)
  return entity
}
