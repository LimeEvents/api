require('dotenv').load()
if (process.env.NODE_ENV !== 'development') {
  process.exit()
}
const AWS = require('aws-sdk')
const db = new AWS.DynamoDB({
  region: 'us-west-2',
  apiVersion: '2012-08-10',
  endpoint: process.env.DYNAMO_ENDPOINT
})
const dynalite = require('dynalite')

const dynaliteServer = dynalite({ path: './tmp', createTableMs: 0 })

const tables = ['Event', 'Location', 'Performer', 'Order']

dynaliteServer.listen(4567, async (err) => {
  if (err) throw err
  while (tables.length) {
    try {
      const name = tables.pop()
      const results = await db.createTable({
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        TableName: name
      }).promise()
    } catch (ex) {
      console.error(ex)
    }
  }
  process.nextTick(() => {
    setTimeout(() => {
      process.exit()
    }, 10000)
  })
})
