const { execute, makePromise } = require('apollo-link')
const { parse } = require('graphql')

exports.Binding = class Binding {
  constructor ({ link, name }) {
    this.link = link
    this.name = name.toLowerCase()
  }

  async get (id, selectionSet = '{ id }', name = this.name) {
    const query = `
      query Get_${name}($id: ID!) {
        ${name}(id: $id) ${selectionSet}
      }
    `
    const results = await this.request(query, { id })
    return results[name]
  }
  async request (query, variables = {}, context = {}, operationName, extensions = {}) {
    if (typeof query === 'string') query = parse(query)
    const operation = {
      query,
      variables,
      operationName,
      context: { ...context, viewer: { roles: ['system'] } },
      extensions
    }

    const { data, errors } = await makePromise(execute(this.link, operation))
    if (errors) throw errors[0]
    return data
  }
}
