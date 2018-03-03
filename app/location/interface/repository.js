const LOCATIONS = {
  'downtown-slc': {
    id: 'downtown-slc',
    name: 'Wiseguys at the Gateway',
    city: 'Salt Lake City',
    state: 'UT',
    street: '194 South 400 West',
    postalCode: '84101',
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=194 South 400 West Salt Lake City UT 84101 US'
  },
  'ogden': {
    id: 'ogden',
    name: 'Wiseguys Comedy Club Ogden',
    city: 'Ogden',
    state: 'UT',
    street: '269 25th St',
    postalCode: '84401',
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=269 25th St Ogden UT 84401 US'
  },
  'jordan-landing': {
    id: 'jordan-landing',
    name: 'Wiseguys Jordan Landing',
    city: 'West Jordan',
    state: 'UT',
    street: '3763 West Center Park Drive',
    postalCode: '84084',
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=3763 West Center Park Drive West Jordan UT 84084 US'
  }
}

module.exports = {
  async get (id) {
    return LOCATIONS[id]
  },
  async find () {
    return Object.values(LOCATIONS)
  },
  async save (events) {
    throw new Error('Not implemented')
  }
}
