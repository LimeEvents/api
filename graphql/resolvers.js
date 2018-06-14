exports.resolvers = {
  Query: {
    ping () {
      return 'pong'
    },
    async health (source, args, { application }) {
      const results = await application.health({})
      console.log("results'", results)
      return results
    }
  }
}
