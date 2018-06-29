const AWS = require('aws-sdk')
const db = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: process.env.AWS_REGION,
  params: {
    TableName: process.env.PRODUCT_TABLE
  }
})

async function sink ({ _type, _timestamp, ...event }) {
  switch (_type) {
    case 'ProductAdded':
      await db.put({
        Item: event
      }).promise()
      break
    case 'ProductUpdated':
      const { Item: entity } = await db.get({ Key: { id: event.id } }).promise()
      await db.put({
        Item: { ...entity, ...event }
      }).promise()
      break
    case 'ProductRemoved':
      await db.delete({
        Key: { id: event.id }
      }).promise()
      break
  }
}

exports.sink = async ({ Records }, context, callback) => {
  const results = await Promise.all(Records.map(({ Sns }) => sink(JSON.parse(Sns.Message))))
  callback(null, results)
}

console.log('cold start')
