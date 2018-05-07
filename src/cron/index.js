

const Monk = require('monk')
const memo = require('lodash.memoize')
const Event = require('./Event')
const connect = memo((url) => new Monk(url))

async function poll () {

}

// Event.find()
//   .then(console.log.bind(console))
//   .catch(console.error.bind(console))
