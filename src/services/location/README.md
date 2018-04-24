Example queries:
```graphql
fragment LocationFragment on Location {
  id
  name
  caption
  description
  slug
  address {
    address1
    locality
    region
    postalCode
    country
  }
  images
  capacity
}

query Locations {
  locations {
    edges {
      node {
        ...LocationFragment
      }
    }
  }
}

query Location($locationId: ID!) {
  location(id: $locationId) {
    ...LocationFragment
  }
}
```
