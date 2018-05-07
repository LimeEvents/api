const memo = require('lodash.memoize')

const LOCATIONS = [{
  id: 'b795f6c5-1bea-439a-887d-877d37dbad35',
  slug: 'downtown-slc',
  name: 'Salt Lake',
  images: [],
  address: {
    address1: '194 South 400 West',
    locality: 'Salt Lake City',
    postalCode: '84101',
    region: 'UT',
    country: 'USA'
  },
  googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=194%20South%20400%20West%20Salt%20Lake%20City%20UT%2084101%20US',
  capacity: 300
},
{
  id: '069a486e-c045-4682-bf5d-683732f27d8f',
  slug: 'ogden',
  name: 'Ogden',
  images: [],
  address: {
    address1: '269 25th St',
    locality: 'Ogden',
    postalCode: '84401',
    region: 'UT',
    country: 'USA'
  },
  googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=269%2025th%20St%20Ogden%20UT%2084401%20US',
  capacity: 170
},
{
  id: '365bb253-b50c-4505-874f-664e04351b01',
  slug: 'jordan-landing',
  name: 'Jordan Landing',
  images: [],
  address: {
    address1: '3763 West Center Park Drive',
    locality: 'West Jordan',
    postalCode: '84084',
    region: 'UT',
    country: 'USA'
  },
  googleMapsUrl: 'http://www.google.com/maps?f=q&hl=en&ie=UTF8&z=15&om=1&iwloc=addr&q=3763%20West%20Center%20Park%20Drive%20West%20Jordan%20UT%2084084%20US',
  capacity: 300
}]

const getLocation = memo((id) => LOCATIONS.find(location => location.id === id) || null)

exports.repository = memo((tenantId) => ({
  async get (id) {
    return getLocation(id)
  },
  async find () {
    return LOCATIONS
  },
  async save (events) {
    throw new Error('Not implemented')
  }
}))
