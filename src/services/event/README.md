Example queries:

```graphql
fragment EventFragment on Event {
  id
  name
  start
  end
  doorsOpen
  image
  video
  minimumAge
  locationId
  feeDistribution
  cancelled
}

query Events {
  events {
    edges {
      node {
        ...EventFragment
      }
    }
  }
}

mutation CreateEvent ($createEvent: CreateEventInput!) {
  createEvent(input: $createEvent) {
    clientMutationId
    event {
      ...EventFragment
    }
  }
}
```
