const { mergeSchemas } = require('graphql-tools')
const remoteSchema = require('./remote-schema')

const linkSchema = `
extend type ComedyEvent {
  venue: Venue!
}
extend type Venue {
  events(first: Int, last: Int, before: String, after: String): EventConnection!
}
`
module.exports = async () => {
  const venueManager = await remoteSchema(process.env.VENUE_MANAGER_URL)
  const eventManager = await remoteSchema(process.env.EVENT_MANAGER_URL)
  return mergeSchemas({
    schemas: [ eventManager, venueManager, linkSchema ],
    resolvers (mergeInfo) {
      return {
        ComedyEvent: {
          venue: {
            fragment: `fragment ComedyEventFragment on ComedyEvent { venue_id }`,
            resolve (source, args, context, info) {
              console.log('source!!!!!!!!!!!', source)
              return mergeInfo.delegate(
                'query',
                'venue',
                {
                  id: source.venue_id
                },
                context,
                info
              )
            }
          }
        }
      }
    }
  })
}
