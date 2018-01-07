const express = require('express')
const graphql = require('express-graphql')

const schemaPromise = require('./schema')()

const PORT = process.env.PORT || 3000

const app = express()
schemaPromise
  .then((schema) => {
    app.use('/graphql', graphql({
      schema,
      context: {},
      graphiql: process.env.NODE_ENV !== 'production',
      formatError (ex) {
        return {
          message: ex.message,
          stack: ex.stack
        }
      }
    }))

    app.listen(PORT, () => console.info(`Gateway listening on port "${PORT}"`))
  })
