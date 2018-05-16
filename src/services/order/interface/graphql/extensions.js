exports.definition = `
  extend type Order {
    event: Event!
  }
  extend type Query {
    tickets(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    subtotal(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    customerFee(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    locationFee(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    salesTax(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    total(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    amountPaid(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
    amountRefunded(filter: MetricFilter! first: Int, last: Int, before: String, after: String): OrderMetricConnection!
  }
`
exports.resolvers = ({ event, order }) => ({
  Query: {
    tickets: metricResolver('tickets', order),
    subtotal: metricResolver('subtotal', order),
    customerFee: metricResolver('customerFee', order),
    locationFee: metricResolver('locationFee', order),
    salesTax: metricResolver('salesTax', order),
    total: metricResolver('total', order),
    amountPaid: metricResolver('amountPaid', order),
    amountRefunded: metricResolver('amountRefunded', order)
  },
  Order: {
    event: {
      fragment: 'fragment OrderEventFragment on Order { eventId }',
      resolve ({ eventId }, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: event,
          operation: 'query',
          fieldName: 'event',
          args: { id: eventId },
          context,
          info
        })
      }
    }
  }
})

function metricResolver (field, schema) {
  return (source, args, context, info) => {
    return info.mergeInfo.delegateToSchema({
      schema,
      operation: 'query',
      fieldName: 'orderMetrics',
      args: { ...args, filter: { ...args.filter, aggregate: field } },
      context,
      info
    })
  }
}
