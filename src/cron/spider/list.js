const { parser } = require('./parser')
const { getEvent } = require('./item')
const { TICKET_BISCUIT_URL } = require('./constants')
const { toGlobalId } = require('graphql-relay')

function getEventID (url) {
  return /\d+$/.exec(url)[0]
}

function getAccountID (url) {
  return /Wiseguys\w+/i.exec(url)[0]
}

function getNextPage ($) {
  return $('#event-list-table-next-page-content a').attr('href')
}

function getVenues (...venueIDs) {
  return Promise.all(
    venueIDs.map(getVenue)
  ).then((results) => [].concat(...results))
}

function getVenue (venueID) {
  return getList(`${TICKET_BISCUIT_URL}/${venueID}/Events`)
}

function getList (url) {
  const venueID = getAccountID(url)
  return parser(url)
    .then(($) => {
      const nextPage = getNextPage($)
      const idList = $('a.event-title-link').map(function () {
        return toGlobalId(venueID, getEventID($(this).attr('href')))
      }).get()

      if (nextPage) {
        return getList(`${TICKET_BISCUIT_URL}${nextPage}`)
          .then((events) => {
            return events.concat(idList)
          })
      }

      return idList
    })
}

async function populateEvents (events) {
  const fulfilled = await Promise.all(
    events.map(async event => {
      try {
        return await getEvent(event)
      } catch (ex) {
        return null
      }
    })
  )
  return fulfilled.filter(Boolean)
}

exports.getVenue = getVenue
exports.getVenues = getVenues
exports.populateEvents = populateEvents
