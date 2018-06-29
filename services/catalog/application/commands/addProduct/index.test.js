/* eslint-env jest */

const { domain } = require('./index')

const FAKE_PRODUCT = {
  name: 'Google Home'
}

describe('product', () => {
  describe('add', () => {
    describe('domain', () => {
      it('returns an array of events', () => {
        const results = domain({}, { product: FAKE_PRODUCT })
        expect(results).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            created: expect.any(Number),
            updated: expect.any(Number),
            ...FAKE_PRODUCT
          })
        )
      })
    })
  })
})
