const domain = (viewer, { orders }) => {
  const list = orders
    .reduce((list, { id, willcall, tickets }) => {
      list[id] = {
        tickets,
        names: willcall
      }
      return list
    }, {})

  return list
}

const application = ({ read, write, ...services }) => async (viewer, eventId) => {
  const orders = await this.find(viewer, { paid: true })
  return domain.getWillcallList(viewer, { orders })
}

exports.application = application
exports.domain = domain
