const gql = require('graphql-tag')

exports.definition = gql`
  interface Node {
    id: ID!
  }
`
