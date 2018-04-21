const assert = require('assert')
const uuid = require('uuid/v4')
const { Event } = require('@vivintsolar/repository')

exports.get = (viewer, { customer }) => {
  assert(viewer.id === customer.id || viewer.roles.includes('administrator'), 'Unauthorized to view customer data')
  assert(customer, 'Customer does not exist')
  return customer
}
exports.find = (viewer, { customers }) => {
  return customers.map((customer) => exports.get(viewer, { customer }))
}
exports.create = (viewer, { address, contact }) => {
  return [
    new Event('CustomerCreated', {
      id: uuid(),
      contact,
      address
    })
  ]
}
