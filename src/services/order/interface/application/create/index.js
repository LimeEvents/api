const assert = require('assert')
const uuid = require('uuid/v4')

const domain = (viewer, { inventory, event, location, tickets }) => {
  const id = uuid()
  assert(inventory, 'Invalid event')
  assert(inventory.available >= tickets, 'Not enough available seats. Please try again.')
  assert(tickets > 0, 'Must reserve at least one ticket')

  const {
    id: eventId,
    price,
    feeDistribution,
    performerIds
  } = event

  const subtotal = tickets * price
  const salesTax = Math.ceil(subtotal * 0.0675)
  const fee = calculateFee(tickets, price)

  const locationFee = Math.ceil(fee * feeDistribution / 100)
  const customerFee = fee - locationFee

  const total = subtotal + salesTax + customerFee

  return [
    {
      _type: 'OrderCreated',
      _timestamp: Date.now(),
      id,
      eventId,
      performerIds,
      locationId: location.id,
      tickets,
      price,
      subtotal,
      salesTax,
      fee: locationFee + customerFee,
      locationFee,
      customerFee,
      total
    }
  ]
}

const application = (repo, services) => async (viewer, { eventId, tickets }) => {
  const inventory = await services.getInventory(viewer, eventId)
  const event = await services.event.get(viewer, eventId, '{ price locationId id feeDistribution performerIds }')
  const location = await services.location.get(viewer, event.locationId, '{ id address { postalCode } }')
  return repo.save(
    domain(viewer, { inventory, eventId, tickets, event, location })
  )
}

const FIFTEEN_MINUTES = 1000 * 60 * 15

const reducer = {
  OrderCreated (entity, event) {
    return {
      ...entity,
      id: event.id,
      eventId: event.eventId,
      locationId: event.locationId,
      performerIds: event.performerIds,

      tickets: event.tickets,

      expired: FIFTEEN_MINUTES + event._timestamp,

      customerFee: event.customerFee,
      locationFee: event.locationFee,
      fee: event.fee,
      salesTax: event.salesTax,
      subtotal: event.subtotal,
      total: event.total,
      created: event._timestamp
    }
  }
}

function calculateFee (tickets, price) {
  const amount = tickets * price
  // Fee: 3% + $0.50/ticket
  return Math.ceil((tickets * 0.5) + (amount * 0.03))
}

exports.application = application
exports.domain = domain
exports.reducer = reducer
