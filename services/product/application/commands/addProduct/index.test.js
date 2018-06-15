/* eslint-env jest */

const { domain } = require('./index')

describe('product', () => {
  describe('add', () => {
    describe('domain', () => {
      it('returns an array of events', () => {
        const results = domain({}, { product: {} })
        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              _timestamp: expect.any(Number),
              _type: 'ProductAdded'
            })
          ])
        )
      })
    })
  })
})
