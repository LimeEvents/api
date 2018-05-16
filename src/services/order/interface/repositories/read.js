const Monk = require('monk')
const moment = require('moment')
const memo = require('lodash.memoize')
const { reducer: getOrder } = require('../application/get')
const Dataloader = require('dataloader')

const REDUCERS = [getOrder]

const connect = memo((url) => new Monk(url))

const _view = Symbol('_view')
const _cache = Symbol('_cache')
const INIT = Object.freeze({
  price: 0,
  tickets: 0,
  subtotal: 0,
  customerFee: 0,
  locationFee: 0,
  salesTax: 0,
  total: 0,
  amountPaid: 0,
  amountRefunded: 0,
  willcall: []
})

const update = (db) => (fn) => async (event) => {
  const entity = await db.findOne({ id: event.id })
  const order = fn(entity || INIT, event)
  await db.update({ id: event.id }, order, { upsert: true })
  return order
}

class ReadRepository {
  constructor (tenantId, emitter) {
    this[_view] = connect(process.env.MONGODB_URL).get('order_view', { castIds: false })

    this[_cache] = new Dataloader(async (ids) => {
      const results = await this[_view].find({ id: { $in: ids } })
      const map = results.reduce((prev, curr) => {
        prev[curr.id] = curr
        return prev
      }, {})
      return ids.map((id) => map[id] || null)
    })
    const orderUpdate = update(this[_view])
    REDUCERS.forEach((reducer) => {
      Object.entries(reducer)
        .forEach(([ key, value ]) => {
          const fn = orderUpdate(value)
          emitter.on(key, (event) => {
            this[_cache].clear(event.id).prime(event.id, fn(event))
          })
        })
    })
  }

  async get (id) {
    const order = await this[_cache].load(id)
    return order || null
  }

  async find (params = {}) {
    return this[_view].find({ ...params, amountPaid: { $gt: 0 } })
  }

  async count (field, value, args) {
    const {
      start = Date.now(),
      interval = 'all'
    } = args
    const params = { [field]: value }
    if (interval !== 'all') {
      const end = moment(start).endOf(interval)
      params.created = { $gte: end, $lte: start }
    }
    return this[_view].count(params)
  }

  async aggregate (field, args) {
    const {
      start = Date.now(),
      first = 1,
      filter: { interval = 'week', eventId, locationId }
    } = args
    const end = moment(start).endOf(interval).subtract(first, interval).unix() * 1000
    const buckets = createBuckets(start, first, interval)
    const query = [
      {
        $match: {
          created: { $gte: end, $lte: start }
        }
      }
    ]

    if (locationId) {
      query.push({
        $match: {
          locationId: locationId
        }
      })
    }
    if (eventId) {
      query.push({
        $match: {
          eventId: eventId
        }
      })
    }

    if (buckets.length > 1) {
      query.push({
        $bucket: {
          groupBy: '$created',
          boundaries: buckets,
          default: 'Other',

          output: {
            value: { $sum: `$${field}` },
            ids: { $push: '$id' }
          }
        }
      })
    } else {
      query.push({
        $group: {
          _id: start,
          value: { $sum: `$${field}` },
          ids: { $push: '$id' }
        }
      })
    }

    const results = await this[_view].aggregate(query)

    if (results.length === 1 && buckets.length === 1) {
      return [{
        value: results[0].value,
        type: 'aggregate',
        field,
        timestamp: start
      }]
    }

    return buckets.map((timestamp) => {
      const _value = results.find(({ _id }) => {
        return _id === timestamp
      })
      let value = 0
      if (_value) {
        value = _value.value
      }
      return {
        value,
        type: 'aggregate',
        field,
        timestamp
      }
    })
  }
}

function createBuckets (start, count = 1, interval = 'week') {
  start = moment(start)
  return new Array(count + 1)
    .fill(null)
    .map((_, idx) => start.clone().subtract(idx, interval).endOf(interval).unix() * 1000)
    .reverse()
}
exports.repository = (tenantId, emitter) => new ReadRepository(tenantId, emitter)
