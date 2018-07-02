const { Repository } = require('./Repository')

const { health } = require('./queries/health')

const { addProduct } = require('./commands/addProduct')
const { updateProduct } = require('./commands/updateProduct')
const { removeProduct } = require('./commands/removeProduct')
const { addProductVariant } = require('./commands/addProductVariant')
const { updateProductVariant } = require('./commands/updateProductVariant')
const { removeProductVariant } = require('./commands/removeProductVariant')
const { getProduct } = require('./queries/getProduct')
const { getVariant } = require('./queries/getVariant')
const { listProducts } = require('./queries/listProducts')
const { listProductVariantIds } = require('./queries/listProductVariantIds')

const { addChannel } = require('./commands/addChannel')
const { enableChannel } = require('./commands/enableChannel')
const { disableChannel } = require('./commands/disableChannel')
const { updateChannel } = require('./commands/updateChannel')
const { publishChannelProduct } = require('./commands/publishChannelProduct')
const { unpublishChannelProduct } = require('./commands/unpublishChannelProduct')
const { removeChannel } = require('./commands/removeChannel')
const { getChannel } = require('./queries/getChannel')
const { listChannels } = require('./queries/listChannels')
const { listChannelProductIds } = require('./queries/listChannelProductIds')

exports.application = (viewer, repository = new Repository()) => {
  return {
    addProduct: addProduct(repository, viewer),
    updateProduct: updateProduct(repository, viewer),
    removeProduct: removeProduct(repository, viewer),

    getProduct: getProduct(repository, viewer),
    getVariant: getVariant(repository, viewer),
    listProducts: listProducts(repository, viewer),
    addProductVariant: addProductVariant(repository, viewer),
    updateProductVariant: updateProductVariant(repository, viewer),
    removeProductVariant: removeProductVariant(repository, viewer),
    listProductVariantIds: listProductVariantIds(repository, viewer),

    addChannel: addChannel(repository, viewer),
    enableChannel: enableChannel(repository, viewer),
    disableChannel: disableChannel(repository, viewer),
    updateChannel: updateChannel(repository, viewer),
    publishChannelProduct: publishChannelProduct(repository, viewer),
    unpublishChannelProduct: unpublishChannelProduct(repository, viewer),
    removeChannel: removeChannel(repository, viewer),
    getChannel: getChannel(repository, viewer),
    listChannels: listChannels(repository, viewer),
    listChannelProductIds: listChannelProductIds(repository, viewer),
    health: health(repository, viewer)
  }
}
exports.getViewer = async (token) => {
  return { roles: ['administrator'] }
}
