const gql = require('graphql-tag')
const { execute, makePromise } = require('apollo-link')
const { link } = require('../../../event')

exports.repository = (tenantId) => ({
  async get (viewer, id, selectionSet) {
    const operation = {
      query: gql`
        query GetEvent($id: ID!) {
          event(id: $id) ${selectionSet}
        }
      `,
      variables: { id },
      context: { viewer }
    }
    const _link = await (typeof link === 'function' ? link() : link)
    const { data, errors } = await makePromise(execute(_link, operation))
    if (errors) throw errors[0]
    return data.event
  }
})
