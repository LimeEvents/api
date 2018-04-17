const { execute, makePromise } = require('apollo-link')
const { parse } = require('graphql')

exports.Binding = class Binding {
  constructor ({ link }) {
    this.link = link
  }
  request (query, variables = {}, context = {}, operationName, extensions = {}) {
    if (typeof query === 'string') query = parse(query)
    const operation = {
      query,
      variables,
      operationName,
      context,
      extensions
    }

    return makePromise(execute(this.link, operation))
  }
}
