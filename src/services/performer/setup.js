const faker = require('faker')

const application = require('./interface/application')

const VIEWER = { roles: ['admin'], name: 'system' }

async function createFakePerformers () {
  if (process.env.NODE_ENV === 'production') throw new Error('Cannot run fake data script on production')

  const performers = await Promise.all(
    new Array(Math.ceil(Math.random() * 1000)).fill(null).map(async () => {
      const performer = await application.register(VIEWER, {
        name: `${faker.name.firstName()} ${faker.name.lastName()}`, // String!
        caption: faker.lorem.sentence(), // String
        description: faker.lorem.paragraph, // String
        images: [faker.image.people()], // [ Url! ]
        videos: [faker.image.people()] // [ Url! ]
      })
      return performer
    })
  )
  console.info(`Created ${performers.length} performers`)
  const results = await application.find(VIEWER)
  return results
}

createFakePerformers()
  .catch((ex) => {
    console.error('Problem creating performers', ex)
  })
