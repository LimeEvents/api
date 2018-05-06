const { fromGlobalId } = require('graphql-relay')
const memo = require('lodash.memoize')
const Monk = require('monk')
const Dataloader = require('dataloader')

// const REDUCERS = [{
//   OrderCreated (entity, event) {

//   }
// }]

const connect = memo((url) => new Monk(url))

// const reducer = (src = {}, event) => {
//   const entity = Object.assign({
//     feeDistribution: 100
//   }, src)
//   const fn = {
//     EventCancelled () {
//       entity.cancelled = event._timestamp
//       return entity
//     },
//     EventCreated () {
//       entity.id = event.id
//       entity.locationId = event.locationId
// entity.inventory = {
//   capacity: event.capacity || 0,
//   reserved: event.reserved || 0,
//   available: event.available || 0,
//   sold: event.sold || 0
// }

//       entity.performerIds = event.performerIds
//       entity.name = event.name
//       entity.image = event.image
//       entity.video = event.video
//       entity.caption = event.caption
//       entity.description = event.description

//       entity.doorsOpen = event.doorsOpen
//       entity.start = event.start
//       entity.end = event.end
//       entity.price = event.price
//       entity.available = event.available
//       entity.contentRating = event.contentRating
//       entity.minimumAge = event.minimumAge || 0
//       entity.notes = event.notes || []
//       return entity
//     },
//     EventRescheduled () {
//       entity.start = event.start
//       entity.end = event.end
//       entity.doorsOpen = event.doorsOpen
//       return entity
//     }
//   }[event._type]
//   if (typeof fn === 'function') return fn()
//   console.warn(`Invalid event type: "${event._type}"`)
//   return src
// }

const _view = Symbol('_view')
const _cache = Symbol('_cache')

async function update (db, id, entity = {}) {
  await db.update({ id }, entity, { upsert: true })
  return entity
}

class EventReadRepository {
  constructor (tenantId, emitter) {
    this.emitter = emitter
    this[_view] = connect(process.env.MONGODB_URL).get('event_view', { castIds: false })
    this[_cache] = new Dataloader(async (ids) => {
      const results = await this[_view].find({ id: { $in: ids } })
      const map = results.reduce((prev, curr) => {
        prev[curr.id] = curr
        return prev
      }, {})
      return ids.map((id) => map[id] || null)
    })

    emitter.on('OrderCreated', async ({ eventId, tickets }) => {
      eventId = fromGlobalId(eventId).id
      const event = await this[_view].findOne({ id: eventId })
      event.inventory.available -= tickets
      event.inventory.reserved += tickets
      this[_cache].clear(eventId).prime(eventId, update(this[_view], eventId, event))
    })
  }

  async get (id) {
    const event = await this[_view].findOne({ id })
    return event || null
  }

  async find (params) {
    const events = await this[_view].find(params)
    return events || []
  }
}

exports.repository = memo((tenantId, emitter) => new EventReadRepository(tenantId, emitter))
