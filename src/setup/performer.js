const faker = require('faker')
const gql = require('graphql-tag')
const uuid = require('uuid/v4')
const { graphql, print } = require('graphql')
const { loadSchema } = require('../index')
const performers = require('./performers.json')

async function request (query, variables) {
  const { schema } = await loadSchema()
  return graphql(schema, print(query), {}, { viewer: { roles: ['administrator'] } }, variables)
}

const PERFORMER_FRAGMENT = `
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

async function registerPerformer () {
  const { name, image } = pickRandom(performers)[0]
  const performer = await request(REGISTER_PERFORMER_QUERY, { input: {
    clientMutationId: uuid(),
    name,
    caption: faker.lorem.sentence(), // String
    description: faker.lorem.paragraph(), // String
    images: [image]
  }})
  return performer.data.registerPerformer.performer
}

exports.setupPerformer = async function createFakePerformers () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')

  const performers = await Promise.all(
    new Array(Math.ceil(Math.random() * 100)).fill(null).map(() => {
      return registerPerformer()
    })
  )
  console.info(`Created ${performers.length} performers`)
  const results = await request(LIST_PERFORMERS_QUERY)
  return results
}

function pickRandom (arr, count = 1) {
  const results = []
  arr = results.concat(arr)
  while (count--) {
    results.push(...arr.splice(Math.floor(Math.random() * arr.length), 1))
  }
  return results
}
