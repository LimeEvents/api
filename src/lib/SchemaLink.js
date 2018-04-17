const { ApolloLink, Observable } = require('apollo-link')
const { execute } = require('graphql')

exports.SchemaLink = class SchemaLink extends ApolloLink {
  constructor ({ schema, rootValue, context }) {
    super()

    this.schema = schema
    this.rootValue = rootValue
    this.context = context
  }

  request (operation) {
    return new Observable(observer => {
      Promise.resolve(
        execute(
          this.schema,
          operation.query,
          this.rootValue,
          typeof this.context === 'function'
            ? this.context(operation)
            : this.context,
          operation.variables,
          operation.operationName
        )
      )
        .then(data => {
          if (!observer.closed) {
            observer.next(data)
            observer.complete()
          }
        })
        .catch(error => {
          if (!observer.closed) {
            observer.error(error)
          }
        })
    })
  }
}
