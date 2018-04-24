Example queries:
```graphql
fragment CustomerFragment on Customer {
  id
  contact {
    givenName
    familyName
    email
  }
  address {
    address1
    locality
    region
  }
}

mutation CreateCustomer($createCustomer: CreateCustomerInput!) {
  createCustomer(input:$createCustomer){
    clientMutationId
    customer {
      ...CustomerFragment
    }
  }
}

query GetCustomer($customerId: ID!){
  customer(id: $customerId) {
    ...CustomerFragment
  }
}
```
