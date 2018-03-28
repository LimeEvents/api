require('dotenv').load()
const { microGraphiql } = require('apollo-server-micro')
const { router, get, post, options } = require('microrouter')
const { http, schema } = require('./index')

module.exports = router(
  get('/', microGraphiql({ schema, endpointURL: '/' })),
  options('/', http),
  post('/', http)
)
