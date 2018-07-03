const gql = require('graphql-tag')

exports.definition = gql`
  interface Visible {
    media: MediaConnection!
  }

  interface MediaConnection {
    edges: [ MediaEdge! ]!
    pageInfo: PageInfo!
  }

  interface MediaEdge {
    node: Media
    cursor: String
  }

  type Media {
    url: Url!
  }
  enum MediumType {
    Image
    Video
  }
`
