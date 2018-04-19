const faker = require('faker')
const { Binding } = require('@vivintsolar/graphql-stitch-utils')
const gql = require('graphql-tag')
const { link } = require('./index')
const uuid = require('uuid/v4')

const PERFORMER_FRAGMENT = gql`
  fragment PerformerFragment on Performer {
    id
    name
  }
`

const REGISTER_PERFORMER_QUERY = gql`
  mutation RegisterPerformerMutation ($input: RegisterPerformerInput!) {
    registerPerformer(input: $input) {
      clientMutationId
      performer {
        ...PerformerFragment
      }
    }
  }
  ${PERFORMER_FRAGMENT}
`

const LIST_PERFORMERS_QUERY = gql`
  query ListPerformers {
    performers {
      edges {
        node {
          ...PerformerFragment
        }
      }
    }
  }
  ${PERFORMER_FRAGMENT}
`

async function registerPerformer (request) {
  return request(REGISTER_PERFORMER_QUERY, { input: {
    clientMutationId: uuid(),
    name: `${faker.name.firstName()} ${faker.name.lastName()}`, // String!
    caption: faker.lorem.sentence(), // String
    description: faker.lorem.paragraph, // String
    images: [faker.image.people()], // [ Url! ]
    videos: [faker.image.people()] // [ Url! ]
  }})
}

exports.setupPerformer = async function createFakePerformers () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')
  const service = new Binding({ name: 'performer', link: await link() })
  const request = service.request.bind(service)

  const performers = await Promise.all(
    new Array(Math.ceil(Math.random() * 1000)).fill(null).map(() => {
      return registerPerformer(request)
    })
  )
  console.info(`Created ${performers.length} performers`)
  const results = await request(LIST_PERFORMERS_QUERY)
  return results
}
