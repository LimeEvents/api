const { application: find } = require('./find')
const { application: get } = require('./get')
const { application: getInventory } = require('./getInventory')
const { application: getMetrics } = require('./getMetrics')
const { application: getStatistics } = require('./getStatistics')
const { application: getWillcall } = require('./getWillcall')

const { application: charge } = require('./charge')
const { application: create } = require('./create')
const { application: reassign } = require('./reassign')
const { application: refund } = require('./refund')
const { application: transfer } = require('./transfer')

exports.application = ({ read, write, ...services }) => ({
  find: find(read, services),
  get: get(read, services),
  getInventory: getInventory(read, { ...services, find: find(read, services) }),
  getMetrics: getMetrics(read, services),
  getStatistics: getStatistics(read, services),
  getWillcall: getWillcall(read, services),

  charge: charge(write, services),
  create: create(write, { ...services, getInventory: getInventory(read, { ...services, find: find(read, services) }) }),
  reassign: reassign(write, services),
  refund: refund(write, services),
  transfer: transfer(write, services)
})
