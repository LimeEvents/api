/* global describe, it, expect */
const {
  // get,
  // find,
  create
  // cancel,
  // reschedule
} = require('./index')

const admin = { roles: ['admin'] }

describe('Domain', () => {
  describe('Create event', () => {
    it('return a valid "EventCreated" event', () => {
      const event = {
        start: 1519853050611,
        locationId: '1234',
        performerIds: ['1234'],
        price: 10.00,
        minimumAge: 21,
        ageRange: '7-',
        available: 300
      }

      const results = create(admin, { event })
      expect(results).toContainEqual({
        'id': expect.any(String),
        'payload': expect.objectContaining({
          'ageRange': expect.any(String),
          'available': expect.any(Number),
          'locationId': expect.any(String),
          'minimumAge': expect.any(Number),
          'performerIds': expect.arrayContaining([
            expect.any(String)
          ]),
          'price': expect.any(Number),
          'start': expect.any(Number)
        }),
        'timestamp': expect.any(Number),
        'type': 'EventCreated'
      })
    })

    it('throws an unauthorized error if the user can\'t create events', () => {
      expect(() => create(null, {})).toThrowError('Unauthorized')
    })
    it('throws an assertion error if the payload is bad', () => {
      expect(() => create(admin, { event: { start: '1234' } })).toThrowError()
    })
  })
})
