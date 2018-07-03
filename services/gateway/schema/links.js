const AWS = require('aws-sdk')
const { ApolloLink, Observable } = require('apollo-link')
const { print } = require('graphql/language/printer')

const createLambdaLink = (linkOptions = {}) => {
  const {
    // If they use the default Lambda capitalization
    FunctionName,
    InvocationType = 'RequestResponse',
    LogType = 'Tail',
    ClientContext,
    Qualifier,
    ...config
  } = linkOptions

  const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: process.env.AWS_REGION,
    ...config
  })

  return new ApolloLink((operation) => {
    console.log('operation', operation)
    const { query, variables, operationName, extensions } = operation
    const Payload = JSON.stringify({
      operationName,
      extensions,
      variables,
      query: print(query),
      context: operation.getContext && operation.getContext()
    })

    return new Observable(async (observer) => {
      try {
        console.log(FunctionName, Payload)
        const { FunctionError, Payload: result } = await lambda
          .invoke({
            FunctionName,
            InvocationType,
            LogType,
            ClientContext,
            Qualifier,
            Payload
          })
          .promise()
        if (FunctionError) {
          return observer.error(FunctionError === 'Handled' ? result : new Error(result))
        }
        observer.next(JSON.parse(result))
        observer.complete()
      } catch (ex) {
        observer.error(ex)
      }
    })
  })
}

const links = {
  catalog: createLambdaLink({ FunctionName: process.env.PRODUCT_API, region: process.env.AWS_REGION })
}

exports.links = links
