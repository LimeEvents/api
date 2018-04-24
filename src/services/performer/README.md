Example queries:

```graphql

fragment PerformerFragment on Performer {
  id
  name
  slug
  caption
  description
  images
  videos
}

query Performers {
  performers {
    edges {
      node {
        ...PerformerFragment
      }
    }
  }
}

query Performer($performerId: ID!) {
  performer(id: $performerId) {
    ...PerformerFragment
  }
}

mutation UpdatePerformer ($updatePerformer: UpdatePerformerInput!) {
  updatePerformer(input: $updatePerformer) {
    clientMutationId
    performer {
      ...PerformerFragment
    }
  }
}

mutation RemovePerformer ($removePerformer: RemovePerformerInput!){
  removePerformer(input: $removePerformer) {
    clientMutationId
    performers {
      edges {
        node {
          ...PerformerFragment
        }
      }
    }
  }
}
```
