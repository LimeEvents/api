const gql = require('graphql-tag')

exports.definition = gql`
  interface Entity {
    metadata: JSON!
    created: DateTime!
    updated: DateTime!
  }
`
