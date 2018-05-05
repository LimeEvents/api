
const domain = (viewer, { orders, capacity }) => {
  const [ sold, reserved ] = orders
    .filter(({ refunded, paid, created, expired }) => {
      if (refunded) return false
      if (paid) return true
      if (expired < Date.now()) return false
      return true
    })
    .reduce((totals, { id, tickets, paid }) => {
      if (paid) totals[0] += tickets
      else totals[1] += tickets
      return totals
    }, [0, 0])

  return {
    sold,
    available: capacity - reserved - sold,
    capacity,
    reserved
  }
}

const application = (repo, services) => async (viewer, eventId) => {
  const orders = await services.find(viewer, { eventId, refunded: false })
  const { locationId } = await services.event.get(viewer, eventId, '{ locationId }')
  const { capacity } = await services.location.get(viewer, locationId, '{ capacity }')
  return domain(viewer, { orders, capacity })
}

exports.application = application
exports.domain = domain
