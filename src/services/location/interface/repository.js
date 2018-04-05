const LOCATIONS = {
  'downtown-slc': {
    id: 'downtown-slc',
    name: 'Wiseguys at the Gateway',
    address: {
      address1: '194 South 400 West',
      locality: 'Salt Lake City',
      postalCode: '84101',
      region: 'UT'
    },
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=194 South 400 West Salt Lake City UT 84101 US',
    capacity: 300
  },
  'ogden': {
    id: 'ogden',
    name: 'Wiseguys Comedy Club Ogden',
    address: {
      address1: '269 25th St',
      locality: 'Ogden',
      postalCode: '84401',
      region: 'UT'
    },
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=269 25th St Ogden UT 84401 US',
    capacity: 170
  },
  'jordan-landing': {
    id: 'jordan-landing',
    name: 'Wiseguys Jordan Landing',
    address: {
      address1: '3763 West Center Park Drive',
      locality: 'West Jordan',
      postalCode: '84084',
      region: 'UT'
    },
    googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=3763 West Center Park Drive West Jordan UT 84084 US',
    capacity: 300
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
