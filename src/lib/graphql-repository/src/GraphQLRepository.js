const { execute, makePromise } = require('apollo-link')
const { parse, print, GraphQLObjectType } = require('graphql')
const { makeRemoteExecutableSchema, introspectSchema } = require('graphql-tools')

const _nextPage = Symbol('_nextPage')

exports.Repository = class GraphQLRepository {
  constructor ({ link, get, find }) {
    this.link = link
    this.getName = get
    this.findName = find
  }

  async getFullQuery () {
    if (!this.default_query) {
      const schema = makeRemoteExecutableSchema({
        schema: await introspectSchema(this.link),
        link: this.link
      })

      this.default_query = getFullQuery(schema, this.getName)
    }
    console.error('WARNING: NOT USING A SELECTION SET FOR A REMOTE REPOSITORY CAN LEAD TO PERFORMANCE AND UPGRADE PROBLEMS. PLEASE USE ONLY THE DATA YOU NEED.')
    return this.default_query
  }

  async save () {
    // Impossible to use a public interface (GraphQL) to directly and
    // safely save events to another aggregate's repository
    throw new Error('Cannot save remote events')
  }

  async get (id, selectionSet) {
    if (!selectionSet) selectionSet = await this.getFullQuery()
    const query = `
      query Get_${this.getName}($id: ID!) {
        ${this.getName}(id: $id) ${selectionSet}
      }
    `
    const results = await this.request(query, { id })
    return results[this.getName]
  }

  async find (params, selectionSet) {
    if (!selectionSet) selectionSet = await this.getFullQuery()
    const results = []
    let cursor
    while (true) {
      const { pageInfo, edges } = await this[_nextPage](selectionSet, cursor)
      results.push(
        ...edges.map(({ node }) => node)
      )
      if (!pageInfo.hasNextPage) break
      cursor = pageInfo.endCursor
    }
    return results
  }

  async [_nextPage] (selectionSet, cursor) {
    const query = `
      query Find_${this.findName}($first: Int, $last: Int, $before: String, $after: String) {
        ${this.findName}(first: $first, last: $last, before: $before, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node ${selectionSet}
          }
        }
      }
    `
    const results = await this.request(query, { first: 50, after: cursor })
    return results[this.findName]
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

function getFullQuery (schema, field) {
  return print(parse(traverse(schema.getQueryType().getFields()[field].type)))
}

function traverse (type, path = []) {
  const results = Object.entries(type.getFields())
    .reduce((str, [ key, { type } ]) => {
      str += `\n ${key} `
      if (type instanceof GraphQLObjectType && !path.includes(type)) {
        path.push(type)
        str += traverse(type, path)
      }
      return str
    }, '')
  return `{${results}}`
}
