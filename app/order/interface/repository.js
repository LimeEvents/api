const emitter = require('@nerdsauce/adapters/emitter')
const Repo = require('@nerdsauce/adapters/mongo/repository')

exports.reducer = (src, event) => {
  const entity = Object.assign({
    refunded: false,
    paid: false
  }, src)
  const fn = {
    OrderCreated () {
      return {
        id: event.id,
        eventId: event.eventId,
        tickets: event.tickets,
        created: event.meta.timestamp,
        ...entity
      }
    }
    // TicketsReassigned () {
    //   entity.willcall[event.to] -= event.tickets
    //   entity.willcall[event.from] += event.tickets
    //   return entity
    // },
    // TicketsTransferred () {
    //   entity.available += event.tickets
    //   return entity
    // },
    // TicketsPurchased () {
    //   entity.available -= event.tickets
    //   entity.reserved -= event.tickets
    //   entity.sold += event.tickets
    //   entity.willcall[event.name] = event.tickets
    //   return entity
    // },
    // TicketsReturned () {
    //   entity.available += event.tickets
    //   entity.sold -= event.tickets
    //   return entity
    // },
    // ChargeSucceeded () {

    // },
    // ChargeFailed () {

    // }
  }[event.meta.type]

  if (typeof fn === 'function') return fn()
  console.warn(`Invalid event type: "${event.meta.type}"`)
  return src
}

exports.repository = new Repo('ticketing_source', exports.reducer, emitter)
