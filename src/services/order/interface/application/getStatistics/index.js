const domain = (viewer, { orders, startDate, endDate }) => {
  return orders
    .reduce((totals, { eventId: orderEventId, paid, refunded, tickets, amount, fee, salesTax }) => {
      if (!paid) return totals
      totals.gross += amount
      totals.salesTax += salesTax
      if (refunded) {
        totals.refundedAmount += amount
        totals.refunded += tickets
      }
      totals.net += amount - salesTax - fee
      totals.ticketsSold += tickets
      totals.orders += 1
      totals.fees += fee
      return totals
    }, {
      gross: 0,
      net: 0,
      salesTax: 0,
      refundedAmount: 0,
      refunded: 0,
      ticketsSold: 0,
      orders: 0,
      fees: 0,
      startDate,
      endDate
    })
}

const application = ({ read, write, ...services }) => async (viewer, { eventId, performerId, locationId, startDate, endDate }) => {
  let orders = await this.find(viewer, { eventId, performerId, locationId })

  return domain.getStatistics(viewer, { orders, startDate, endDate })
}

exports.application = application
exports.domain = domain
