const gql = require('graphql-tag')

exports.scalars = gql`
  scalar Url
  scalar Currency
  scalar DateTime
  scalar JSON

  enum MediumType {
    Image
    Video
  }

  enum ContentOutputFormat {
    HTML
    Markdown
    Text
  }

  enum ProductType {
    Kit
    Regular
  }
`
