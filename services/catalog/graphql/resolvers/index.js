const merge = require('lodash.merge')
const { resolvers: Interfaces } = require('./interfaces')
const { resolvers: Channel } = require('./channel')
const { resolvers: Product } = require('./product')
const { resolvers: Offer } = require('./offer')

exports.resolvers = merge({}, Product, Channel, Interfaces, Offer)
