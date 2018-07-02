const merge = require('lodash.merge')
const { resolvers: Channel } = require('./channel')
const { resolvers: Product } = require('./product')
const { resolvers: Variant } = require('./variant')

exports.resolvers = merge({}, Product, Channel, Variant)
