require('dotenv').load()
const fs = require('fs')
const path = require('path')
const { introspectionQuery } = require('graphql')
const { graphql: catalog } = require('../catalog/handler')

try {
  fs.mkdirSync(path.resolve(__dirname, './schema/services'))
} catch (ex) {}

const services = { catalog }

Object.entries(services)
  .map(([ key, service ]) => {
    service({
      query: introspectionQuery,
      variables: {},
      context: { getContext: () => ({}) }
    }, {}, (err, result) => {
      if (err) return console.error(err)
      console.log('results', result)
      fs.writeFileSync(path.resolve(__dirname, './schema/services', `${key}.json`), JSON.stringify(result))
    })
  })
