const { Repository } = require('./Repository')

const { health } = require('./queries/health')
const { addProduct } = require('./commands/addProduct')
const { getProduct } = require('./queries/getProduct')
const { listProducts } = require('./queries/listProducts')

exports.application = (viewer, repository = new Repository()) => {
  return {
    addProduct: addProduct(repository, viewer),
    getProduct: getProduct(repository, viewer),
    listProducts: listProducts(repository, viewer),
    health: health(repository, viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['customer'] }
}
