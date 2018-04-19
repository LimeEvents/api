const AWS = require('aws-sdk')
const { Repository } = require('@vivintsolar/event-source-repository')
const { Readable, Writable } = require('./DynamoDbStream')

exports.Repository = class DynamoRepository extends Repository {
  constructor ({
    name,
    reducer = (src, evt) => src,
    emitter,
    tenantId = 'default'
  }) {
    super(name, reducer)
    this.db = new AWS.DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      region: 'us-west-2',
      endpoint: process.env.DYNAMO_ENDPOINT,
      params: {
        TableName: this.name
      }
    })
  }

  read (id, start = new Date(0), end = new Date()) {
    if (!id) {
      return new Readable(this.db, {})
    }
    return new Readable(this.db, {
      // IndexName: 'id',
      KeyConditionExpression: 'id = :id and #tstamp BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#tstamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':id': id,
        ':start': start.getTime(),
        ':end': end.getTime()
      }
    })
  }

  write () {
    return new Writable(this.db, this.name)
  }
}
