/* eslint-env jest */

const { application, domain } = require('./index')

const FAKE_EVENT = {
  'id': 'RXZlbnQ6M2M5ZTFiMzgtOTJjZC00ODJlLWEyMmYtZWQ3YWE2YmQ5OWQ2',
  'locationId': 'TG9jYXRpb246Yjc5NWY2YzUtMWJlYS00MzlhLTg4N2QtODc3ZDM3ZGJhZDM1',
  'performerIds': [
    'UGVyZm9ybWVyOmZkMzdkZjc4LWM3OTktNDBiYy04YjgxLTkwNzA3YjM2OTU2Mg=='
  ],
  'name': 'Jarrod Klocko',
  'image': 'http://lorempixel.com/640/480/people',
  'video': null,
  'caption': null,
  'description': null,
  'doorsOpen': 1527861868545,
  'start': 1527863668545,
  'end': 1527869068545,
  'cancelled': null,
  'price': 3444,
  'feeDistribution': 100,
  'contentRating': 'R',
  'minimumAge': 7,
  'notes': [],
  'inventory': null
}

const FAKE_LOCATION = {
  'id': 'TG9jYXRpb246Yjc5NWY2YzUtMWJlYS00MzlhLTg4N2QtODc3ZDM3ZGJhZDM1',
  'name': 'Wiseguys at the Gateway',
  'caption': null,
  'description': null,
  'slug': 'downtown-slc',
  'address': {
    'address1': '194 South 400 West',
    'locality': 'Salt Lake City',
    'region': 'UT',
    'postalCode': '84101',
    'country': 'USA'
  },
  'images': [],
  'capacity': 300
}

const ADMIN = { roles: ['administrator'] }

function getLocationRepo () {
  return {
    async get (viewer, id) {
      return FAKE_LOCATION
    },
    save: jest.fn(async (events) => {
      return { id: events[0].id }
    })
  }
}
const getEventRepo = () => ({
  async get (id) {
    return { ...FAKE_EVENT, id }
  },
  save: jest.fn(async (events) => {
    return { id: events[0].id }
  })
})

describe('Create event', () => {
  describe('domain', () => {
    it('requires authentication', () => {
      expect(() => domain(null, { now: 0, event: FAKE_EVENT, location: FAKE_LOCATION })).toThrow()
      expect(() => domain(ADMIN, { now: 0, event: FAKE_EVENT, location: FAKE_LOCATION })).not.toThrow()
    })
  })

  it('return a valid "EventCreated" event', () => {
    const event = FAKE_EVENT

    const results = domain(ADMIN, { now: 0, event, location: FAKE_LOCATION })
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          'id': expect.any(String),
          'contentRating': expect.any(String),
          'inventory': expect.objectContaining({
            available: expect.any(Number),
            capacity: expect.any(Number),
            sold: expect.any(Number),
            reserved: expect.any(Number)
          }),
          'locationId': expect.any(String),
          'minimumAge': expect.any(Number),
          'performerIds': expect.arrayContaining([
            expect.any(String)
          ]),
          'price': expect.any(Number),
          'start': expect.any(Number),

          '_timestamp': expect.any(Number),
          '_type': 'EventCreated'
        })
      ])
    )
  })

  it('throws an unauthorized error if the user can\'t create events', () => {
    expect(() => domain(null, {})).toThrowError('Unauthenticated')
  })
  it('throws an assertion error if the payload is bad', () => {
    expect(() => domain(ADMIN, { event: { start: '1234' } })).toThrowError()
  })
  describe('application', () => {
    it('calls Repo.save with an event', async () => {
      const eventRepo = getEventRepo()
      const app = application(eventRepo, { location: getLocationRepo() })
      const order = await app(ADMIN, { ...FAKE_EVENT, id: '1234' })
      expect(order).toEqual(
        expect.objectContaining({
          id: '1234'
        })
      )
      expect(eventRepo.save.mock.calls.length).toBe(1)
      expect(eventRepo.save.mock.calls[0][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1234',
            _type: 'EventCreated',
            _timestamp: expect.any(Number)
          })
        ])
      )
    })
  })
  // describe('reducer', () => {
  //   reducer()
  // })
})
