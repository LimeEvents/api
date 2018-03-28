require('dotenv').load()
const { microGraphiql } = require('apollo-server-micro')
const { router, get, post, options } = require('microrouter')
const http = require('./index')
const schema = require('./schema')

module.exports = router(
  get('/', microGraphiql({ schema, endpointURL: '/' })),
  options('/', http),
  post('/', http)
)
