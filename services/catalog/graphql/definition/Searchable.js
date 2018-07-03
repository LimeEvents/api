const gql = require('graphql-tag')

exports.definition = gql`
  interface Searchable {
    seo: Seo!
    tags: TagConnection!
  }
  type Seo {
    title: String!
    description: String
    image: String
  }

  interface TagConnection {
    edges: [TagEdge!]!
    pageInfo: PageInfo!
  }

  interface TagEdge {
    node: Tag!
    cursor: String
  }

  type Tag {
    key: String!
    value: String
  }
`
