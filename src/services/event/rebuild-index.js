require('dotenv').load()
const { repository } = require('./interface/repository')

repository('default')
  .rebuildIndex()
  .then(() => console.info('Index successfully rebuilt'))
  .then(() => process.exit(0))
  .catch((ex) => {
    console.error(ex)
    process.exit(1)
  })
