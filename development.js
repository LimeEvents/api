require('dotenv').load()
const { microGraphiql } = require('apollo-server-micro')
const { router, get, post } = require('microrouter')
const { http, schema } = require('./index')

module.exports = router(
  get('/', microGraphiql({ schema, endpointURL: '/' })),
  post('/', http)
)
