const faker = require('faker')
const gql = require('graphql-tag')
const uuid = require('uuid/v4')
const { graphql, print } = require('graphql')
const { loadSchema } = require('../index')

async function request (query, variables) {
  const { schema } = await loadSchema()
  return graphql(schema, print(query), {}, { viewer: { roles: ['administrator'] } }, variables)
}

const OrderFragment = gql`
  fragment OrderFragment on Order {
    id
    eventId
    price
    tickets
    subtotal
    customerFee
    locationFee
    salesTax
    total
    amountPaid
    amountRefunded
    fingerprint
    willcall
    created
    updated
  }
`

const CreateOrder = gql`
  ${OrderFragment}
  mutation createOrder($createOrder: CreateOrderInput!) {
    createOrder(input: $createOrder) {
      clientMutationId
      order {
        ...OrderFragment
      }
    }
  }
`
const ChargeOrder = gql`
  ${OrderFragment}
  mutation chargeOrder($chargeOrder: ChargeOrderInput!) {
    chargeOrder(input: $chargeOrder) {
      clientMutationId
      order {
        ...OrderFragment
      }
    }
  }
`
// const RefundOrder = gql`
//   ${OrderFragment}
//   mutation refundOrder($refundOrder: RefundOrderInput!) {
//     refundOrder(input: $refundOrder) {
//       clientMutationId
//       order {
//         ...OrderFragment
//       }
//     }
//   }
// `
// const TransferOrder = gql`
//   ${OrderFragment}
//   mutation transferOrder($transferOrder: TransferOrderInput!) {
//     transferOrder(input: $transferOrder) {
//       clientMutationId
//       order {
//         ...OrderFragment
//       }
//     }
//   }
// `
// const ReassignOrder = gql`
//   ${OrderFragment}
//   mutation reassignOrder($reassignOrder: ReassignOrderInput!) {
//     reassignOrder(input: $reassignOrder) {
//       clientMutationId
//       order {
//         ...OrderFragment
//       }
//     }
//   }
// `

async function listEvents () {
  const results = await request(gql`
    { events { edges { node { id } } } }
  `)
  return results.data.events.edges.map(({ node }) => node)
}

async function getRandomEventId () {
  const events = await listEvents()
  return pickRandom(events)[0].id
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}

async function createOrder () {
  const order = await request(CreateOrder, { createOrder: {
    clientMutationId: uuid(),
    eventId: await getRandomEventId(),
    tickets: Math.floor(Math.random() * 8) + 1
  }})
  if (order.errors) {
    console.error('create error', order.errors)
    // throw order.errors[0]
  }
  return order.data.createOrder.order
}

async function chargeOrder (id) {
  const results = await request(ChargeOrder, { chargeOrder: {
    clientMutationId: uuid(),
    id,
    name: `${faker.name.firstName()} ${faker.name.lastName()}`,
    email: faker.internet.email(),
    source: uuid()
  }})
  return results.data.chargeOrder.order
}

const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

async function orderWorkflow () {
  let order = await createOrder()
  await delay(500)
  order = await chargeOrder(order.id)
  return order
}

exports.setupOrder = async function createFakeOrders () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')
  const num = Math.ceil(Math.random() * 1000)
  // const num = 1
  for (let i = 0; i < num; i++) {
    await orderWorkflow()
  }
  console.info(`Created ${num} orders`)
}
