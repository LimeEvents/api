const assert = require('assert')

exports.get = (viewer, { location }) => {
  assert(location, 'Location does not exist')
  return location
}
exports.find = (viewer, { locations }) => {
  return locations
}
