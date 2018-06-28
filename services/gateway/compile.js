require('dotenv').load()
const fs = require('fs')
const path = require('path')
const { parse, introspectionQuery } = require('graphql')
const { links } = require('./schema/links')

fs.mkdirSync(path.resolve(__dirname, './schema/services'))

Object.entries(links)
  .map(async ([ key, link ]) => {
    try {
      const observable = link.request({
        query: parse(introspectionQuery),
        variables: {},
        context: { getContext: () => ({}) }
      })
      observable.subscribe(result => {
        fs.writeFileSync(path.resolve(__dirname, './schema/services', `${key}.json`), JSON.stringify(result))
      })
    } catch (ex) {
      console.log(ex)
    }
  })
